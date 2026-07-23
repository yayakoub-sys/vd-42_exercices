"use strict";

const $ = (sel) => document.querySelector(sel);

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString("fr-FR");
}

const STATE_LABELS = {
  done: "traités", classified: "classés", to_resolve: "à résoudre",
  missing: "disparus", pending: "en attente", processing: "en cours",
};

// --- Statut global ---
async function refreshStatus() {
  try {
    const s = await getJSON("/api/status");
    $("#status").textContent =
      `Volume : ${s.watch_path || "(non défini)"} — ${s.documents} document(s) consigné(s)`;
  } catch (e) {
    $("#status").textContent = "Impossible de joindre le moteur : " + e.message;
  }
}

// --- Couverture (finitude : total = somme des états) ---
async function refreshCoverage() {
  try {
    const r = await getJSON("/api/reconciliation");
    $("#covPct").textContent = `${r.coverage_pct}%`;
    $("#covFill").style.width = `${r.coverage_pct}%`;
    const counts = r.counts || {};
    $("#covCounts").innerHTML = Object.entries(counts).map(([k, v]) =>
      `<span class="chip ${k}">${esc(STATE_LABELS[k] || k)} : ${v}</span>`
    ).join("") + `<span class="chip">total : ${r.total}</span>`;
    const reasons = r.reasons_to_resolve || [];
    $("#covReasons").innerHTML = reasons.length
      ? "À résoudre — motifs : " + reasons.map((x) => `${esc(x.reason)} (${x.n})`).join(" · ")
      : (r.covered ? "✅ Tout le disque est couvert : aucun fichier en attente." : "");
  } catch (e) {
    $("#covReasons").textContent = "Couverture indisponible : " + e.message;
  }
}

async function requeue() {
  try {
    const r = await fetch("/api/requeue", { method: "POST" }).then((x) => x.json());
    $("#covReasons").textContent = `${r.requeued} fichier(s) réinjecté(s) pour un nouvel essai.`;
    refreshCoverage();
  } catch (e) {
    $("#covReasons").textContent = "Rejeu impossible : " + e.message;
  }
}

// --- Liste / recherche ---
function renderResults(items, { snippet } = {}) {
  const ul = $("#results");
  ul.innerHTML = "";
  if (!items.length) {
    ul.innerHTML = '<li class="empty">Aucun résultat.</li>';
    return;
  }
  for (const it of items) {
    const li = document.createElement("li");
    li.innerHTML =
      `<div class="name">${esc(it.name)}</div>` +
      `<div class="meta">${esc(it.ext || "")} · ${esc(it.method || "")} · ${esc(fmtDate(it.extracted_at))}</div>` +
      (snippet && it.extrait ? `<div class="snippet">${esc(it.extrait)}</div>` : "");
    li.addEventListener("click", () => openDetail(it.id));
    ul.appendChild(li);
  }
}

async function doSearch() {
  const q = $("#q").value.trim();
  if (!q) return listAll();
  try {
    const items = await getJSON(`/api/search?q=${encodeURIComponent(q)}`);
    renderResults(items, { snippet: true });
  } catch (e) {
    $("#results").innerHTML = `<li class="empty">Erreur : ${esc(e.message)}</li>`;
  }
}

async function listAll() {
  const items = await getJSON("/api/documents?limit=200");
  renderResults(items);
}

// --- Détail ---
function entTable(rows, cols) {
  if (!rows.length) return '<div class="empty">Aucune donnée.</div>';
  const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join("");
  const body = rows.map((r) =>
    `<tr>${cols.map((c) => `<td>${esc(r[c.key])}</td>`).join("")}</tr>`
  ).join("");
  return `<table class="ent"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

async function openDetail(id) {
  const doc = await getJSON(`/api/documents/${id}`);
  $("#detail").classList.remove("hidden");
  $("#detailName").textContent = doc.name;
  $("#exportJson").href = `/api/documents/${id}/export.json`;
  $("#exportCsv").href = `/api/documents/${id}/export.csv`;

  $("#tab-entites").innerHTML = entTable(doc.entites || [], [
    { key: "type", label: "Type" },
    { key: "value", label: "Valeur" },
    { key: "raw", label: "Brut" },
    { key: "position", label: "Pos." },
  ]);
  $("#tab-champs").innerHTML = entTable(doc.champs || [], [
    { key: "template", label: "Modèle" },
    { key: "field", label: "Champ" },
    { key: "value", label: "Valeur" },
  ]);
  $("#tab-texte").textContent = doc.text || "(vide)";
  $("#tab-json").textContent = JSON.stringify(doc, null, 2);

  showTab("entites");
  $("#detail").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showTab(name) {
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === name));
  for (const p of ["entites", "champs", "texte", "json"]) {
    $(`#tab-${p}`).classList.toggle("hidden", p !== name);
  }
}

// --- Événements ---
$("#searchBtn").addEventListener("click", doSearch);
$("#q").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearch(); });
$("#allBtn").addEventListener("click", listAll);
$("#closeDetail").addEventListener("click", () => $("#detail").classList.add("hidden"));
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => showTab(t.dataset.tab)));

$("#requeueBtn").addEventListener("click", requeue);

// --- Démarrage ---
refreshStatus();
refreshCoverage();
listAll();
setInterval(() => { refreshStatus(); refreshCoverage(); }, 5000);

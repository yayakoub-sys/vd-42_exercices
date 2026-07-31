/** Construit un bloc EMVCo Tag+Length+Value, pour fabriquer des QR de test réalistes. */
export function tlv(tag: string, value: string): string {
  return tag + String(value.length).padStart(2, '0') + value;
}

export function buildSampleEmvcoQr(merchantName: string): string {
  const merchantAccountTemplate = tlv('00', 'A000000001') + tlv('01', 'MERCHANT123');
  return [
    tlv('00', '01'), // Payload Format Indicator
    tlv('01', '11'), // Point of Initiation Method (statique)
    tlv('26', merchantAccountTemplate), // Merchant Account Information
    tlv('53', '952'), // Devise = XOF (952)
    tlv('54', '1500'), // Montant
    tlv('58', 'CI'), // Pays
    tlv('59', merchantName),
    tlv('60', 'ABIDJAN'),
    tlv('63', '1D3A'), // CRC (non vérifié ici, hors-scope MVP)
  ].join('');
}

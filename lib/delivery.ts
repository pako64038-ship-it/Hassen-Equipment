// Delivery zones (the 58 wilayas) and the payment methods offered at checkout.
export const WILAYAS: [string, string][] = [
  ['01', 'Adrar'], ['02', 'Chlef'], ['03', 'Laghouat'], ['04', 'Oum El Bouaghi'], ['05', 'Batna'], ['06', 'Béjaïa'], ['07', 'Biskra'],
  ['08', 'Béchar'], ['09', 'Blida'], ['10', 'Bouira'], ['11', 'Tamanrasset'], ['12', 'Tébessa'], ['13', 'Tlemcen'], ['14', 'Tiaret'],
  ['15', 'Tizi Ouzou'], ['16', 'Alger'], ['17', 'Djelfa'], ['18', 'Jijel'], ['19', 'Sétif'], ['20', 'Saïda'], ['21', 'Skikda'],
  ['22', 'Sidi Bel Abbès'], ['23', 'Annaba'], ['24', 'Guelma'], ['25', 'Constantine'], ['26', 'Médéa'], ['27', 'Mostaganem'],
  ['28', "M'Sila"], ['29', 'Mascara'], ['30', 'Ouargla'], ['31', 'Oran'], ['32', 'El Bayadh'], ['33', 'Illizi'],
  ['34', 'Bordj Bou Arréridj'], ['35', 'Boumerdès'], ['36', 'El Tarf'], ['37', 'Tindouf'], ['38', 'Tissemsilt'], ['39', 'El Oued'],
  ['40', 'Khenchela'], ['41', 'Souk Ahras'], ['42', 'Tipaza'], ['43', 'Mila'], ['44', 'Aïn Defla'], ['45', 'Naâma'],
  ['46', 'Aïn Témouchent'], ['47', 'Ghardaïa'], ['48', 'Relizane'], ['49', 'Timimoun'], ['50', 'Bordj Badji Mokhtar'],
  ['51', 'Ouled Djellal'], ['52', 'Béni Abbès'], ['53', 'In Salah'], ['54', 'In Guezzam'], ['55', 'Touggourt'], ['56', 'Djanet'],
  ['57', "El M'Ghair"], ['58', 'El Meniaa'],
];
export const wilayaName = (code: string) => { const w = WILAYAS.find((x) => x[0] === code); return w ? `${w[0]} · ${w[1]}` : code; };

export const PAYMENTS: Record<string, { label: string; hint: string }> = {
  cod: { label: 'الدفع عند الاستلام', hint: 'تخلّص كي توصلك السلعة.' },
  ccp: { label: 'تحويل CCP', hint: 'تحوّل للحساب CCP ونبعتولك السلعة.' },
  baridimob: { label: 'BaridiMob', hint: 'تحوّل من التطبيق BaridiMob للـRIP تاعنا.' },
  store: { label: 'الدفع في المحل', hint: 'تخلّص كي تجي للمحل.' },
};

// Delivery fee for a wilaya: its own price if set, else the default; null = to be agreed with the seller.
export function deliveryFee(prices: Record<string, number | null> | null | undefined, def: number | null | undefined, code: string): number | null {
  const p = prices && prices[code];
  if (p != null && !isNaN(Number(p))) return Number(p);
  return def == null || isNaN(Number(def)) ? null : Number(def);
}

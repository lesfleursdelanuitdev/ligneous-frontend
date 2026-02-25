export function stripSlashes(name) {
  if (!name) return name;
  return String(name).replace(/\//g, '').replace(/\s+/g, ' ').trim();
}

const GEDCOM_EVENT_LABELS = {
  BIRT: 'Birth',
  DEAT: 'Death',
  MARR: 'Marriage',
  DIV: 'Divorce',
  BURI: 'Burial',
  BAPM: 'Baptism',
  CHR: 'Christening',
  CENS: 'Census',
  RESI: 'Residence',
  OCCU: 'Occupation',
};

export function formatEventType(type) {
  if (!type) return 'Event';
  const key = String(type).toUpperCase();
  if (GEDCOM_EVENT_LABELS[key]) return GEDCOM_EVENT_LABELS[key];
  return String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

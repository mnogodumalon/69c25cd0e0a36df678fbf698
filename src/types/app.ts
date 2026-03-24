// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Vereinsversammlungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum_uhrzeit?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    thema?: string;
    teilnehmer?: string;
  };
}

export interface Mitgliederverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    jahresbeitrag_status?: string; // Format: YYYY-MM-DD oder ISO String
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    email?: string;
    telefonnummer?: string;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    ort?: string;
    eintrittsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    mitgliedsstatus?: LookupValue;
    abteilung?: string;
  };
}

export interface Zutaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    zutaten_name?: string;
    kategorie?: LookupValue;
    masseinheit?: string;
    notizen?: string;
  };
}

export interface Rezepte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    rezept_name?: string;
    beschreibung?: string;
    zubereitungszeit?: number;
    schwierigkeitsgrad?: LookupValue;
    portionen?: number;
    zutaten_auswahl?: string;
    zubereitung?: string;
    rezeptkategorie?: LookupValue;
    transportierbar?: boolean;
  };
}

export interface PicknickPlanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    datum_uhrzeit?: string; // Format: YYYY-MM-DD oder ISO String
    ort?: string;
    teilnehmerzahl?: number;
    rezepte_auswahl?: string;
    ausruestung?: string;
    notizen?: string;
  };
}

export const APP_IDS = {
  VEREINSVERSAMMLUNGEN: '69c25d746aa6e65246bf78e0',
  MITGLIEDERVERWALTUNG: '69c25cc1ebf1d1582e70a7db',
  ZUTATEN: '69c2a7ac637f3ccda4a668e4',
  REZEPTE: '69c2a7b1bb682cf3bdb2d5e9',
  PICKNICK_PLANUNG: '69c2a7b22cfea3390e04fbb4',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  mitgliederverwaltung: {
    mitgliedsstatus: [{ key: "aktiv", label: "Aktiv" }, { key: "passiv", label: "Passiv" }, { key: "ausgetreten", label: "Ausgetreten" }],
  },
  zutaten: {
    kategorie: [{ key: "obst", label: "Obst" }, { key: "fleisch", label: "Fleisch" }, { key: "kaese", label: "Käse" }, { key: "brot", label: "Brot" }, { key: "getraenk", label: "Getränk" }, { key: "sonstiges", label: "Sonstiges" }, { key: "gemuese", label: "Gemüse" }],
  },
  rezepte: {
    schwierigkeitsgrad: [{ key: "einfach", label: "Einfach" }, { key: "mittel", label: "Mittel" }, { key: "schwierig", label: "Schwierig" }],
    rezeptkategorie: [{ key: "wrap", label: "Wrap" }, { key: "sandwich", label: "Sandwich" }, { key: "salat", label: "Salat" }, { key: "snack", label: "Snack" }, { key: "getraenk", label: "Getränk" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'vereinsversammlungen': {
    'datum_uhrzeit': 'date/datetimeminute',
    'ort': 'string/text',
    'thema': 'string/text',
    'teilnehmer': 'multipleapplookup/select',
  },
  'mitgliederverwaltung': {
    'jahresbeitrag_status': 'date/date',
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'email': 'string/email',
    'telefonnummer': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'ort': 'string/text',
    'eintrittsdatum': 'date/date',
    'mitgliedsstatus': 'lookup/radio',
    'abteilung': 'string/text',
  },
  'zutaten': {
    'zutaten_name': 'string/text',
    'kategorie': 'lookup/select',
    'masseinheit': 'string/text',
    'notizen': 'string/textarea',
  },
  'rezepte': {
    'rezept_name': 'string/text',
    'beschreibung': 'string/textarea',
    'zubereitungszeit': 'number',
    'schwierigkeitsgrad': 'lookup/select',
    'portionen': 'number',
    'zutaten_auswahl': 'multipleapplookup/select',
    'zubereitung': 'string/textarea',
    'rezeptkategorie': 'lookup/select',
    'transportierbar': 'bool',
  },
  'picknick_planung': {
    'datum_uhrzeit': 'date/datetimeminute',
    'ort': 'string/text',
    'teilnehmerzahl': 'number',
    'rezepte_auswahl': 'multipleapplookup/select',
    'ausruestung': 'string/textarea',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateVereinsversammlungen = StripLookup<Vereinsversammlungen['fields']>;
export type CreateMitgliederverwaltung = StripLookup<Mitgliederverwaltung['fields']>;
export type CreateZutaten = StripLookup<Zutaten['fields']>;
export type CreateRezepte = StripLookup<Rezepte['fields']>;
export type CreatePicknickPlanung = StripLookup<PicknickPlanung['fields']>;
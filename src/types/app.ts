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

export interface Features {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    feature_name?: string;
    feature_beschreibung?: string;
    feature_kategorie?: LookupValue;
    feature_prioritaet?: LookupValue;
  };
}

export interface Testergebnisse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    feature_ref?: string; // applookup -> URL zu 'Features' Record
    tester_name?: string;
    testdatum?: string; // Format: YYYY-MM-DD oder ISO String
    test_status?: LookupValue;
    test_notizen?: string;
  };
}

export interface Fehlerberichte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    fehler_feature_ref?: string; // applookup -> URL zu 'Features' Record
    fehlerbeschreibung?: string;
    fehler_schweregrad?: LookupValue;
    ait_referenz?: string;
    fehler_status?: LookupValue;
    fehler_screenshot?: string;
  };
}

export const APP_IDS = {
  VEREINSVERSAMMLUNGEN: '69c25d746aa6e65246bf78e0',
  MITGLIEDERVERWALTUNG: '69c25cc1ebf1d1582e70a7db',
  REZEPTE: '69c2a7b1bb682cf3bdb2d5e9',
  ZUTATEN: '69c2a7ac637f3ccda4a668e4',
  PICKNICK_PLANUNG: '69c2a7b22cfea3390e04fbb4',
  FEATURES: '69c2a885ef5542af1ff3e803',
  TESTERGEBNISSE: '69c2a88646e6d003d7275863',
  FEHLERBERICHTE: '69c2a887234dbbd08df29869',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  mitgliederverwaltung: {
    mitgliedsstatus: [{ key: "aktiv", label: "Aktiv" }, { key: "passiv", label: "Passiv" }, { key: "ausgetreten", label: "Ausgetreten" }],
  },
  rezepte: {
    schwierigkeitsgrad: [{ key: "einfach", label: "Einfach" }, { key: "mittel", label: "Mittel" }, { key: "schwierig", label: "Schwierig" }],
    rezeptkategorie: [{ key: "wrap", label: "Wrap" }, { key: "sandwich", label: "Sandwich" }, { key: "salat", label: "Salat" }, { key: "snack", label: "Snack" }, { key: "getraenk", label: "Getränk" }],
  },
  zutaten: {
    kategorie: [{ key: "gemuese", label: "Gemüse" }, { key: "obst", label: "Obst" }, { key: "fleisch", label: "Fleisch" }, { key: "kaese", label: "Käse" }, { key: "brot", label: "Brot" }, { key: "getraenk", label: "Getränk" }, { key: "sonstiges", label: "Sonstiges" }],
  },
  features: {
    feature_kategorie: [{ key: "authentifizierung", label: "Authentifizierung" }, { key: "navigation", label: "Navigation" }, { key: "benachrichtigung", label: "Benachrichtigung" }, { key: "chat", label: "Chat" }, { key: "dashboard", label: "Dashboard" }, { key: "sonstiges", label: "Sonstiges" }],
    feature_prioritaet: [{ key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
  },
  testergebnisse: {
    test_status: [{ key: "bestanden", label: "Bestanden" }, { key: "fehlgeschlagen", label: "Fehlgeschlagen" }, { key: "ausstehend", label: "Ausstehend" }],
  },
  fehlerberichte: {
    fehler_schweregrad: [{ key: "kritisch", label: "Kritisch" }, { key: "hoch", label: "Hoch" }, { key: "mittel", label: "Mittel" }, { key: "niedrig", label: "Niedrig" }],
    fehler_status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "behoben", label: "Behoben" }],
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
  'zutaten': {
    'zutaten_name': 'string/text',
    'kategorie': 'lookup/select',
    'masseinheit': 'string/text',
    'notizen': 'string/textarea',
  },
  'picknick_planung': {
    'datum_uhrzeit': 'date/datetimeminute',
    'ort': 'string/text',
    'teilnehmerzahl': 'number',
    'rezepte_auswahl': 'multipleapplookup/select',
    'ausruestung': 'string/textarea',
    'notizen': 'string/textarea',
  },
  'features': {
    'feature_name': 'string/text',
    'feature_beschreibung': 'string/textarea',
    'feature_kategorie': 'lookup/select',
    'feature_prioritaet': 'lookup/select',
  },
  'testergebnisse': {
    'feature_ref': 'applookup/select',
    'tester_name': 'string/text',
    'testdatum': 'date/datetimeminute',
    'test_status': 'lookup/radio',
    'test_notizen': 'string/textarea',
  },
  'fehlerberichte': {
    'fehler_feature_ref': 'applookup/select',
    'fehlerbeschreibung': 'string/textarea',
    'fehler_schweregrad': 'lookup/select',
    'ait_referenz': 'string/text',
    'fehler_status': 'lookup/select',
    'fehler_screenshot': 'file',
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
export type CreateRezepte = StripLookup<Rezepte['fields']>;
export type CreateZutaten = StripLookup<Zutaten['fields']>;
export type CreatePicknickPlanung = StripLookup<PicknickPlanung['fields']>;
export type CreateFeatures = StripLookup<Features['fields']>;
export type CreateTestergebnisse = StripLookup<Testergebnisse['fields']>;
export type CreateFehlerberichte = StripLookup<Fehlerberichte['fields']>;
// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Mitgliederverwaltung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
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

export const APP_IDS = {
  MITGLIEDERVERWALTUNG: '69c25cc1ebf1d1582e70a7db',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  mitgliederverwaltung: {
    mitgliedsstatus: [{ key: "aktiv", label: "Aktiv" }, { key: "passiv", label: "Passiv" }, { key: "ausgetreten", label: "Ausgetreten" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'mitgliederverwaltung': {
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
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMitgliederverwaltung = StripLookup<Mitgliederverwaltung['fields']>;
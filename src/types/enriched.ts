import type { Fehlerberichte, PicknickPlanung, Rezepte, Testergebnisse, Vereinsversammlungen } from './app';

export type EnrichedVereinsversammlungen = Vereinsversammlungen & {
  teilnehmerName: string;
};

export type EnrichedRezepte = Rezepte & {
  zutaten_auswahlName: string;
};

export type EnrichedPicknickPlanung = PicknickPlanung & {
  rezepte_auswahlName: string;
};

export type EnrichedTestergebnisse = Testergebnisse & {
  feature_refName: string;
};

export type EnrichedFehlerberichte = Fehlerberichte & {
  fehler_feature_refName: string;
};

import type { PicknickPlanung, Rezepte, Vereinsversammlungen } from './app';

export type EnrichedVereinsversammlungen = Vereinsversammlungen & {
  teilnehmerName: string;
};

export type EnrichedRezepte = Rezepte & {
  zutaten_auswahlName: string;
};

export type EnrichedPicknickPlanung = PicknickPlanung & {
  rezepte_auswahlName: string;
};

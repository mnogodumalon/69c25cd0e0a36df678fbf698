import type { Vereinsversammlungen } from './app';

export type EnrichedVereinsversammlungen = Vereinsversammlungen & {
  teilnehmerName: string;
};

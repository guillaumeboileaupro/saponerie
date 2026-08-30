import { useSyncExternalStore } from "react";
import dataset from "../../../data/fats.2026-08-30.json";
import { loadUserFats, saveUserFats, type UserFatDefinition } from "./userFatsStorage";
import type { Fat } from "../../core/types";

/**
 * Statut de vérification d'un indice SAP, voir docs/SOURCES.md. Une entrée
 * `documentary` ou `userDefined` doit toujours rester visible comme non
 * vérifiée dans l'UI (§5 de docs/PROJECT_CONTEXT.md).
 */
export type SapStatus = "documentary" | "cross_checked" | "verified" | "user_defined";

export interface FatCatalogEntry {
  fat: Fat;
  aliases: string[];
  source: string;
  status: SapStatus;
  verifiedAt: string | null;
  crossCheckNote: string | null;
}

interface RawFatEntry {
  id: string;
  displayName: string;
  aliases: string[];
  sapNaOH: string;
  sapKOH: string | null;
  source: string;
  status: string;
  verifiedAt: string | null;
  crossCheckNote?: string;
  isUserDefined: boolean;
}

interface RawDataset {
  version: string;
  fats: RawFatEntry[];
}

const raw = dataset as RawDataset;

export const fatsDatasetVersion = raw.version;

const baseCatalog: FatCatalogEntry[] = raw.fats.map((entry) => ({
  fat: {
    id: entry.id,
    displayName: entry.displayName,
    sapNaOH: entry.sapNaOH,
    sapKOH: entry.sapKOH,
  },
  aliases: entry.aliases,
  source: entry.source,
  status: entry.status as SapStatus,
  verifiedAt: entry.verifiedAt,
  crossCheckNote: entry.crossCheckNote ?? null,
}));

function userFatToEntry(definition: UserFatDefinition): FatCatalogEntry {
  return {
    fat: {
      id: definition.id,
      displayName: definition.displayName,
      sapNaOH: definition.sapNaOH,
      sapKOH: definition.sapKOH,
    },
    aliases: [],
    source: "utilisateur",
    status: "user_defined",
    verifiedAt: null,
    crossCheckNote: null,
  };
}

let userFats: UserFatDefinition[] = loadUserFats();
let catalog: FatCatalogEntry[] = [...baseCatalog, ...userFats.map(userFatToEntry)];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

/** Lecture non réactive, pour du code hors composants React (ex. state.ts). */
export function getFatsCatalog(): FatCatalogEntry[] {
  return catalog;
}

/**
 * Ajoute un ingrédient personnalisé (§5 de docs/PROJECT_CONTEXT.md : un
 * utilisateur avancé peut créer un ingrédient, mais l'indice n'est jamais
 * présenté comme vérifié). Renvoie l'entrée créée pour l'ajouter aussitôt
 * à la recette en cours d'édition.
 */
export function addUserFat(displayName: string, sapNaOH: string, sapKOH: string | null): FatCatalogEntry {
  const definition: UserFatDefinition = {
    id: `custom-${crypto.randomUUID()}`,
    displayName,
    sapNaOH,
    sapKOH,
  };
  userFats = [...userFats, definition];
  saveUserFats(userFats);
  catalog = [...baseCatalog, ...userFats.map(userFatToEntry)];
  notifyListeners();
  return userFatToEntry(definition);
}

/** Catalogue réactif : se met à jour quand un ingrédient personnalisé est ajouté. */
export function useFatsCatalog(): FatCatalogEntry[] {
  return useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => listeners.delete(onStoreChange);
    },
    getFatsCatalog,
  );
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterFatsCatalog(entries: FatCatalogEntry[], query: string): FatCatalogEntry[] {
  const needle = normalize(query.trim());
  if (needle === "") {
    return entries;
  }
  return entries.filter((entry) => {
    const haystacks = [entry.fat.displayName, ...entry.aliases];
    return haystacks.some((text) => normalize(text).includes(needle));
  });
}

export function isUnverified(status: SapStatus): boolean {
  return status === "documentary" || status === "user_defined";
}

const STATUS_LABELS: Record<SapStatus, string> = {
  documentary: "documentaire, à vérifier",
  cross_checked: "recoupé avec plusieurs sources",
  verified: "vérifié",
  user_defined: "saisi par l'utilisateur, non vérifié",
};

/**
 * Provenance lisible d'un ingrédient, affichée systématiquement (§ revue
 * sécurité/qualité : la source et la version du jeu de données doivent
 * apparaître dans l'éditeur, les résultats et les exports, pas seulement
 * pour les entrées non vérifiées).
 */
export function describeProvenance(entry: FatCatalogEntry): string {
  const parts = [`Source : ${entry.source}`, `Statut : ${STATUS_LABELS[entry.status]}`];
  if (entry.verifiedAt) {
    parts.push(`Vérifié le ${entry.verifiedAt}`);
  }
  if (entry.crossCheckNote) {
    parts.push(entry.crossCheckNote);
  }
  return parts.join(" — ");
}

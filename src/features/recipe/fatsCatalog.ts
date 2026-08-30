import dataset from "../../../data/fats.2026-08-30.json";
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
  isUserDefined: boolean;
}

interface RawDataset {
  version: string;
  fats: RawFatEntry[];
}

const raw = dataset as RawDataset;

export const fatsDatasetVersion = raw.version;

export const fatsCatalog: FatCatalogEntry[] = raw.fats.map((entry) => ({
  fat: {
    id: entry.id,
    displayName: entry.displayName,
    sapNaOH: entry.sapNaOH,
    sapKOH: entry.sapKOH,
  },
  aliases: entry.aliases,
  source: entry.source,
  status: entry.status as SapStatus,
}));

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function searchFatsCatalog(query: string): FatCatalogEntry[] {
  const needle = normalize(query.trim());
  if (needle === "") {
    return fatsCatalog;
  }
  return fatsCatalog.filter((entry) => {
    const haystacks = [entry.fat.displayName, ...entry.aliases];
    return haystacks.some((text) => normalize(text).includes(needle));
  });
}

export function isUnverified(status: SapStatus): boolean {
  return status === "documentary" || status === "user_defined";
}

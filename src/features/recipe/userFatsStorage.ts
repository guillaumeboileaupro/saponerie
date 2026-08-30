// Persistance légère des ingrédients personnalisés dans le stockage du
// navigateur intégré à la webview Tauri (survit aux redémarrages de
// l'application). Une vraie base locale (SQLite, voir ADR 0004) remplacera
// ce mécanisme quand la sauvegarde de recettes complètes sera implémentée ;
// en attendant, ceci suffit pour que les indices saisis par l'utilisateur ne
// soient pas perdus à chaque lancement.
const STORAGE_KEY = "la-saponnerie:custom-fats:v1";

export interface UserFatDefinition {
  id: string;
  displayName: string;
  sapNaOH: string;
  sapKOH: string | null;
}

export function loadUserFats(): UserFatDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserFatDefinition[]) : [];
  } catch {
    return [];
  }
}

export function saveUserFats(fats: UserFatDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fats));
  } catch {
    // Stockage indisponible (quota, mode privé) : l'ingrédient reste
    // utilisable pour la session en cours mais ne sera pas conservé.
  }
}

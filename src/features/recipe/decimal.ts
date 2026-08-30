/**
 * Vérifie qu'une chaîne est un nombre décimal positif syntaxiquement valide
 * (ex. "12", "12.5"), avant de la transmettre au moteur Rust. Le moteur
 * refuse déjà les valeurs hors bornes métier (§4.6 de
 * docs/PROJECT_CONTEXT.md) ; ce contrôle purement syntaxique évite
 * seulement qu'une chaîne non numérique fasse échouer la désérialisation
 * côté Rust au lieu de produire un message clair.
 */
export function isValidPositiveDecimal(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}

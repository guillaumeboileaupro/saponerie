import { useState } from "react";
import { calculateRecipe } from "./core/calculateRecipe";
import type { CalculationResult, RecipeInput, ValidationError } from "./core/types";
import "./App.css";

// Reprend le Cas A de docs/PROJECT_CONTEXT.md §11.1, pour vérifier de bout
// en bout que l'UI, la commande Tauri et le moteur Rust communiquent
// correctement. Ce n'est PAS l'écran final : l'éditeur de recette réel
// (sélection des huiles, tableau éditable, etc.) reste à concevoir et à
// valider avec Guillaume (maquettes, palette) avant implémentation.
const CAS_A_DEMO: RecipeInput = {
  ingredients: [
    { fat: { id: "tournesol", displayName: "Tournesol", sapNaOh: "0.134", sapKoh: null }, massGrams: "200" },
    { fat: { id: "olive", displayName: "Olive", sapNaOh: "0.134", sapKoh: null }, massGrams: "320" },
    { fat: { id: "coco", displayName: "Huile de coco", sapNaOh: "0.183", sapKoh: null }, massGrams: "200" },
    { fat: { id: "cire-abeille", displayName: "Cire d'abeille", sapNaOh: "0.069", sapKoh: null }, massGrams: "30" },
  ],
  superfatPercent: "5",
  lyePurityPercent: "100",
  waterMode: { mode: "percentOfOils", value: "35" },
};

function describeError(error: ValidationError): string {
  switch (error.type) {
    case "emptyRecipe":
      return "La recette ne contient aucun corps gras.";
    case "nonPositiveMass":
      return `Masse invalide pour « ${error.details.fatId} ».`;
    case "missingOrNonPositiveSapNaOh":
      return `Indice SAP NaOH manquant ou invalide pour « ${error.details.fatId} ».`;
    case "superfatOutOfRange":
      return `Surgras hors bornes autorisées (${error.details} %).`;
    case "lyePurityOutOfRange":
      return `Pureté de soude hors bornes autorisées (${error.details} %).`;
    case "concentrationOutOfRange":
      return `Concentration de soude hors bornes (${error.details}).`;
    case "waterLyeRatioOutOfRange":
      return `Ratio eau/soude hors bornes (${error.details}).`;
    case "percentOfOilsOutOfRange":
      return `Pourcentage d'eau hors bornes (${error.details} %).`;
  }
}

function App() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);

  async function runDemo() {
    setLoading(true);
    const outcome = await calculateRecipe(CAS_A_DEMO);
    if (outcome.ok) {
      setResult(outcome.result);
      setErrors([]);
    } else {
      setResult(null);
      setErrors(outcome.errors);
    }
    setLoading(false);
  }

  return (
    <main className="container">
      <h1>La Saponnerie — démonstration technique</h1>
      <p>
        Écran temporaire vérifiant la liaison UI ↔ Tauri ↔ moteur Rust sur le
        « Cas A » du support de référence. L'éditeur de recette réel n'est
        pas encore conçu.
      </p>

      <button type="button" onClick={runDemo} disabled={loading}>
        {loading ? "Calcul en cours…" : "Calculer le Cas A de référence"}
      </button>

      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((error) => (
            <li key={JSON.stringify(error)}>{describeError(error)}</li>
          ))}
        </ul>
      )}

      {result && (
        <dl>
          <dt>Masse totale des corps gras</dt>
          <dd>{result.totalFatGrams} g</dd>
          <dt>NaOH théorique</dt>
          <dd>{result.theoreticalNaohGrams} g</dd>
          <dt>NaOH après surgras et pureté</dt>
          <dd>{result.weighedNaohGrams} g</dd>
          <dt>Eau</dt>
          <dd>{result.waterGrams} g</dd>
        </dl>
      )}
    </main>
  );
}

export default App;

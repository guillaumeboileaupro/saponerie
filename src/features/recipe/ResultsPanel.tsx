import type { CalculationResult, ValidationError } from "../../core/types";
import { describeValidationError } from "./describeValidationError";
import { formatDecimal } from "./formatDecimal";

interface ResultsPanelProps {
  result: CalculationResult | null;
  errors: ValidationError[];
  isComplete: boolean;
  isCalculating: boolean;
}

export function ResultsPanel({ result, errors, isComplete, isCalculating }: ResultsPanelProps) {
  if (!isComplete) {
    return (
      <div className="results-state" role="status">
        Complétez la recette (au moins un corps gras avec sa masse) pour voir les résultats.
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="results-state results-state-error" role="alert">
        <p>Recette non exploitable en l'état :</p>
        <ul>
          {errors.map((error) => (
            <li key={JSON.stringify(error)}>{describeValidationError(error)}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-state" role="status" aria-live="polite">
        {isCalculating ? "Calcul en cours…" : "En attente de calcul."}
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <dl className="results-summary">
        <div className="results-row">
          <dt>Masse totale des corps gras</dt>
          <dd>{formatDecimal(result.totalFatGrams)} g</dd>
        </div>
        <div className="results-row">
          <dt>NaOH théorique</dt>
          <dd>{formatDecimal(result.theoreticalNaohGrams)} g</dd>
        </div>
        <div className="results-row">
          <dt>NaOH après surgras</dt>
          <dd>{formatDecimal(result.discountedNaohGrams)} g</dd>
        </div>
        <div className="results-row results-row-highlight">
          <dt>NaOH à peser</dt>
          <dd>{formatDecimal(result.weighedNaohGrams)} g</dd>
        </div>
        <div className="results-row results-row-highlight">
          <dt>Eau</dt>
          <dd>{formatDecimal(result.waterGrams)} g</dd>
        </div>
        <div className="results-row">
          <dt>Masse totale estimée</dt>
          <dd>{formatDecimal(result.totalBatchGrams)} g</dd>
        </div>
      </dl>

      {result.warnings.length > 0 && (
        <ul className="results-warnings" role="status">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <details className="assumptions">
        <summary>Hypothèses de calcul</summary>
        <ul>
          {result.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

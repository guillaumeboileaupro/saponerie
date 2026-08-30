import type { CalculationResult, ValidationError } from "../../core/types";
import { addDecimal } from "./decimalMath";
import { describeValidationError } from "./describeValidationError";
import { fatsDatasetVersion } from "./fatsCatalog";
import { formatDecimal } from "./formatDecimal";

interface ResultsPanelProps {
  result: CalculationResult | null;
  errors: ValidationError[];
  technicalError: string | null;
  isComplete: boolean;
  isCalculating: boolean;
  additivesTotalMass: string;
  beeswaxMass: string | null;
}

export function ResultsPanel({
  result,
  errors,
  technicalError,
  isComplete,
  isCalculating,
  additivesTotalMass,
  beeswaxMass,
}: ResultsPanelProps) {
  if (!isComplete) {
    return (
      <div className="results-state" role="status">
        Complétez la recette (au moins un corps gras avec sa masse) pour voir les résultats.
      </div>
    );
  }

  if (technicalError) {
    return (
      <div className="results-state results-state-error" role="alert">
        <p>Le calcul n'a pas pu être effectué (erreur technique, pas un problème de recette) :</p>
        <p>{technicalError}</p>
        <p className="field-hint">Réessayez ; si le problème persiste, signalez-le avec ce message.</p>
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
      <div className="primary-results" aria-label="Quantités principales à peser">
        <div>
          <span>Cire d'abeille</span>
          <strong>{beeswaxMass ? formatDecimal(beeswaxMass) : "—"}</strong>
          <small>grammes</small>
        </div>
        <div className="primary-result-main">
          <span>Soude NaOH</span>
          <strong>{formatDecimal(result.weighedNaohGrams)}</strong>
          <small>grammes à peser</small>
        </div>
        <div>
          <span>Eau</span>
          <strong>{formatDecimal(result.waterGrams)}</strong>
          <small>grammes</small>
        </div>
      </div>

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
        <div className="results-row">
          <dt>Masse totale estimée (savon)</dt>
          <dd>{formatDecimal(result.totalBatchGrams)} g</dd>
        </div>
        {additivesTotalMass !== "0" && (
          <>
            <div className="results-row">
              <dt>Additifs</dt>
              <dd>{formatDecimal(additivesTotalMass)} g</dd>
            </div>
            <div className="results-row results-row-highlight">
              <dt>Masse totale avec additifs</dt>
              <dd>{formatDecimal(addDecimal(result.totalBatchGrams, additivesTotalMass))} g</dd>
            </div>
          </>
        )}
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
          <li>Jeu de données des corps gras : version {fatsDatasetVersion}</li>
        </ul>
      </details>
    </div>
  );
}

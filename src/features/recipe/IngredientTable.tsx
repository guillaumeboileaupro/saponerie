import { fatsCatalog, isUnverified } from "./fatsCatalog";
import { formatDecimal } from "./formatDecimal";
import type { EditorIngredient } from "./state";
import type { IngredientShare } from "../../core/types";

interface IngredientTableProps {
  ingredients: EditorIngredient[];
  breakdown: IngredientShare[] | null;
  onMassChange: (key: string, massGrams: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: "up" | "down") => void;
}

export function IngredientTable({
  ingredients,
  breakdown,
  onMassChange,
  onRemove,
  onMove,
}: IngredientTableProps) {
  if (ingredients.length === 0) {
    return <p className="empty-state">Aucun corps gras pour l'instant. Cherchez-en un ci-dessus.</p>;
  }

  return (
    <table className="ingredient-table">
      <caption className="visually-hidden">Corps gras de la recette</caption>
      <thead>
        <tr>
          <th scope="col">Corps gras</th>
          <th scope="col">Masse (g)</th>
          <th scope="col">% des huiles</th>
          <th scope="col">
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {ingredients.map((row, index) => {
          const entry = fatsCatalog.find((candidate) => candidate.fat.id === row.catalogId);
          const share = breakdown?.[index];
          const massInputId = `mass-${row.key}`;
          return (
            <tr key={row.key}>
              <th scope="row">
                {entry?.fat.displayName ?? row.catalogId}
                {entry && isUnverified(entry.status) && (
                  <span className="badge badge-warning" title={`Source : ${entry.source}`}>
                    non vérifié
                  </span>
                )}
              </th>
              <td>
                <label htmlFor={massInputId} className="visually-hidden">
                  Masse de {entry?.fat.displayName ?? row.catalogId} en grammes
                </label>
                <input
                  id={massInputId}
                  type="text"
                  inputMode="decimal"
                  className="mass-input"
                  value={row.massGrams}
                  onChange={(event) => onMassChange(row.key, event.currentTarget.value)}
                  placeholder="0"
                />
              </td>
              <td className="numeric">{share ? `${formatDecimal(share.percentOfOils)} %` : "—"}</td>
              <td className="row-actions">
                <button
                  type="button"
                  onClick={() => onMove(row.key, "up")}
                  disabled={index === 0}
                  aria-label={`Monter ${entry?.fat.displayName ?? ""}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMove(row.key, "down")}
                  disabled={index === ingredients.length - 1}
                  aria-label={`Descendre ${entry?.fat.displayName ?? ""}`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="danger-text"
                  onClick={() => onRemove(row.key)}
                  aria-label={`Retirer ${entry?.fat.displayName ?? ""}`}
                >
                  ✕
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

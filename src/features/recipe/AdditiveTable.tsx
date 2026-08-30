import { ADDITIVE_CATEGORIES, type AdditiveCategory, type EditorAdditive } from "./additives";
import { isValidPositiveDecimal } from "./decimal";

interface AdditiveTableProps {
  additives: EditorAdditive[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onNameChange: (key: string, name: string) => void;
  onCategoryChange: (key: string, category: AdditiveCategory) => void;
  onMassChange: (key: string, massGrams: string) => void;
}

export function AdditiveTable({
  additives,
  onAdd,
  onRemove,
  onNameChange,
  onCategoryChange,
  onMassChange,
}: AdditiveTableProps) {
  return (
    <section className="additives-section" aria-labelledby="additives-heading">
      <h3 id="additives-heading">Additifs (argiles, exfoliants, colorants…)</h3>
      <p className="field-hint">
        Les additifs s'ajoutent au poids final mais ne participent pas au calcul de la soude ni de
        l'eau. Un liquide qui remplacerait une partie de l'eau (lait, infusion…) n'est pas encore
        pris en charge ici.
      </p>

      {additives.length > 0 && (
        <table className="ingredient-table additive-table">
          <caption className="visually-hidden">Additifs de la recette</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Catégorie</th>
              <th scope="col">Masse (g)</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {additives.map((additive) => {
              const massInvalid = additive.massGrams.trim() !== "" && !isValidPositiveDecimal(additive.massGrams);
              return (
                <tr key={additive.key}>
                  <td>
                    <label htmlFor={`additive-name-${additive.key}`} className="visually-hidden">
                      Nom de l'additif
                    </label>
                    <input
                      id={`additive-name-${additive.key}`}
                      type="text"
                      value={additive.name}
                      onChange={(event) => onNameChange(additive.key, event.currentTarget.value)}
                      placeholder="Argile verte…"
                    />
                  </td>
                  <td>
                    <label htmlFor={`additive-category-${additive.key}`} className="visually-hidden">
                      Catégorie de l'additif
                    </label>
                    <select
                      id={`additive-category-${additive.key}`}
                      value={additive.category}
                      onChange={(event) =>
                        onCategoryChange(additive.key, event.currentTarget.value as AdditiveCategory)
                      }
                    >
                      {ADDITIVE_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label htmlFor={`additive-mass-${additive.key}`} className="visually-hidden">
                      Masse de l'additif en grammes
                    </label>
                    <input
                      id={`additive-mass-${additive.key}`}
                      type="text"
                      inputMode="decimal"
                      className="mass-input"
                      aria-invalid={massInvalid}
                      value={additive.massGrams}
                      onChange={(event) => onMassChange(additive.key, event.currentTarget.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="danger-text"
                      onClick={() => onRemove(additive.key)}
                      aria-label={`Retirer ${additive.name || "cet additif"}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button type="button" onClick={onAdd}>
        + Ajouter un additif
      </button>
    </section>
  );
}

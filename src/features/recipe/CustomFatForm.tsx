import { useId, useState, type FormEvent } from "react";
import { isValidPositiveDecimal } from "./decimal";
import { addUserFat, type FatCatalogEntry } from "./fatsCatalog";

interface CustomFatFormProps {
  onCreated: (entry: FatCatalogEntry) => void;
  onCancel: () => void;
}

export function CustomFatForm({ onCreated, onCancel }: CustomFatFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [sapNaOH, setSapNaOH] = useState("");
  const [sapKOH, setSapKOH] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (displayName.trim() === "") {
      setError("Le nom est obligatoire.");
      return;
    }
    if (!isValidPositiveDecimal(sapNaOH)) {
      setError("L'indice SAP NaOH doit être un nombre positif (ex. 0.135).");
      return;
    }
    if (sapKOH.trim() !== "" && !isValidPositiveDecimal(sapKOH)) {
      setError("L'indice SAP KOH doit être un nombre positif, ou laissé vide.");
      return;
    }
    const entry = addUserFat(displayName.trim(), sapNaOH.trim(), sapKOH.trim() || null);
    onCreated(entry);
  }

  return (
    <form className="custom-fat-form" onSubmit={handleSubmit}>
      <p className="field-hint">
        Valeur non vérifiée : croisez-la avec une source sérieuse avant de vous y fier (voir
        docs/SOURCES.md).
      </p>

      <div className="field-group">
        <label htmlFor={`${formId}-name`}>Nom du corps gras</label>
        <input
          id={`${formId}-name`}
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.currentTarget.value)}
          autoFocus
        />
      </div>

      <div className="field-group">
        <label htmlFor={`${formId}-naoh`}>Indice SAP NaOH (g de NaOH par g de corps gras)</label>
        <input
          id={`${formId}-naoh`}
          type="text"
          inputMode="decimal"
          value={sapNaOH}
          onChange={(event) => setSapNaOH(event.currentTarget.value)}
          placeholder="0.135"
        />
      </div>

      <div className="field-group">
        <label htmlFor={`${formId}-koh`}>Indice SAP KOH (optionnel)</label>
        <input
          id={`${formId}-koh`}
          type="text"
          inputMode="decimal"
          value={sapKOH}
          onChange={(event) => setSapKOH(event.currentTarget.value)}
          placeholder="facultatif"
        />
      </div>

      {error && (
        <p className="results-state-error" role="alert">
          {error}
        </p>
      )}

      <div className="custom-fat-form-actions">
        <button type="submit">Ajouter cet ingrédient</button>
        <button type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

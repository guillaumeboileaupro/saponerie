import { useId, useState } from "react";
import { CustomFatForm } from "./CustomFatForm";
import { BEESWAX_ID } from "./state";
import {
  describeProvenance,
  filterFatsCatalog,
  isUnverified,
  useFatsCatalog,
  type FatCatalogEntry,
} from "./fatsCatalog";

interface FatPickerProps {
  onSelect: (catalogId: string) => void;
}

export function FatPicker({ onSelect }: FatPickerProps) {
  const [query, setQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const listId = useId();
  const catalog = useFatsCatalog();
  const matches = filterFatsCatalog(catalog, query).filter(
    (entry) => entry.fat.id !== BEESWAX_ID,
  );

  function handleCreated(entry: FatCatalogEntry) {
    onSelect(entry.fat.id);
    setShowCustomForm(false);
    setQuery("");
  }

  return (
    <div className="fat-picker">
      <label htmlFor={`${listId}-input`} className="field-label">
        Ajouter une huile ou un beurre
      </label>
      <input
        id={`${listId}-input`}
        type="text"
        placeholder="Rechercher une huile ou un beurre…"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        aria-controls={listId}
        autoComplete="off"
      />
      <ul id={listId} className="fat-picker-results">
        {matches.length === 0 && <li className="fat-picker-empty">Aucune huile trouvée.</li>}
        {matches.map((entry) => (
          <li key={entry.fat.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(entry.fat.id);
                setQuery("");
              }}
              title={describeProvenance(entry)}
            >
              <span>{entry.fat.displayName}</span>
              {isUnverified(entry.status) && <span className="badge badge-warning">non vérifié</span>}
            </button>
          </li>
        ))}
      </ul>

      {showCustomForm ? (
        <CustomFatForm onCreated={handleCreated} onCancel={() => setShowCustomForm(false)} />
      ) : (
        <button type="button" className="link-button" onClick={() => setShowCustomForm(true)}>
          + Créer un ingrédient personnalisé
        </button>
      )}
    </div>
  );
}

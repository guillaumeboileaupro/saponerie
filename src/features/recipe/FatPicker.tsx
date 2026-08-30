import { useId, useState } from "react";
import { CustomFatForm } from "./CustomFatForm";
import { filterFatsCatalog, isUnverified, useFatsCatalog, type FatCatalogEntry } from "./fatsCatalog";

interface FatPickerProps {
  onSelect: (catalogId: string) => void;
}

export function FatPicker({ onSelect }: FatPickerProps) {
  const [query, setQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const listId = useId();
  const catalog = useFatsCatalog();
  const matches = filterFatsCatalog(catalog, query);

  function handleCreated(entry: FatCatalogEntry) {
    onSelect(entry.fat.id);
    setShowCustomForm(false);
    setQuery("");
  }

  return (
    <div className="fat-picker">
      <label htmlFor={`${listId}-input`} className="field-label">
        Ajouter un corps gras
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
        {matches.length === 0 && <li className="fat-picker-empty">Aucun corps gras trouvé.</li>}
        {matches.map((entry) => (
          <li key={entry.fat.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(entry.fat.id);
                setQuery("");
              }}
            >
              <span>{entry.fat.displayName}</span>
              {isUnverified(entry.status) && (
                <span className="badge badge-warning" title={`Source : ${entry.source}`}>
                  non vérifié
                </span>
              )}
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

import { useEffect, useState } from "react";
import { deleteRecipe, duplicateRecipe, listRecipes, type RecipeSummary } from "./recipeStorage";

interface SavedRecipesListProps {
  onOpen: (id: string) => void;
  refreshKey: number;
}

function formatUpdatedAt(updatedAt: number): string {
  return new Date(updatedAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SavedRecipesList({ onOpen, refreshKey }: SavedRecipesListProps) {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setRecipes(await listRecipes());
      setError(null);
    } catch (cause) {
      setError(`Impossible de charger les recettes enregistrées : ${String(cause)}`);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleDuplicate(id: string) {
    await duplicateRecipe(id);
    await refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer définitivement « ${name} » ?`)) {
      return;
    }
    await deleteRecipe(id);
    await refresh();
  }

  return (
    <section className="saved-recipes" aria-labelledby="saved-recipes-heading">
      <h3 id="saved-recipes-heading">Mes recettes enregistrées</h3>
      {error && <p className="results-state-error">{error}</p>}
      {recipes.length === 0 ? (
        <p className="empty-state">Aucune recette enregistrée pour l'instant.</p>
      ) : (
        <ul className="saved-recipes-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <span className="saved-recipe-name">{recipe.name}</span>
              <span className="field-hint-inline">{formatUpdatedAt(recipe.updatedAt)}</span>
              <span className="saved-recipe-actions">
                <button type="button" onClick={() => onOpen(recipe.id)}>
                  Ouvrir
                </button>
                <button type="button" onClick={() => handleDuplicate(recipe.id)}>
                  Dupliquer
                </button>
                <button
                  type="button"
                  className="danger-text"
                  onClick={() => handleDelete(recipe.id, recipe.name)}
                >
                  Supprimer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

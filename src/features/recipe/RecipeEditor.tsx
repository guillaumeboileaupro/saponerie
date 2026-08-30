import { useState } from "react";
import { AdditiveTable } from "./AdditiveTable";
import { FatPicker } from "./FatPicker";
import { IngredientTable } from "./IngredientTable";
import { exportRecipeToFile, importRecipeFromFile } from "./recipeFile";
import { loadRecipe, saveRecipe } from "./recipeStorage";
import { ResultsPanel } from "./ResultsPanel";
import { SafetyNotice } from "./SafetyNotice";
import { SavedRecipesList } from "./SavedRecipesList";
import { WaterModeSelector } from "./WaterModeSelector";
import { useRecipeEditor } from "./useRecipeEditor";
import "./recipe-editor.css";

const DEFAULT_RECIPE_NAME = "Recette sans nom";

export function RecipeEditor() {
  const editor = useRecipeEditor();
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState(DEFAULT_RECIPE_NAME);
  const [currentRecipeId, setCurrentRecipeId] = useState<string | null>(null);
  const [savedRecipesRefreshKey, setSavedRecipesRefreshKey] = useState(0);

  async function handleExport() {
    const outcome = await exportRecipeToFile(editor.state);
    setFileMessage(outcome.ok ? "Recette exportée." : outcome.message);
  }

  async function handleImport() {
    const outcome = await importRecipeFromFile();
    if (outcome.ok) {
      editor.loadRecipe({
        ingredients: outcome.recipe.ingredients,
        additives: outcome.recipe.additives,
        superfatPercent: outcome.recipe.superfatPercent,
        lyePurityPercent: outcome.recipe.lyePurityPercent,
        waterModeKind: outcome.recipe.waterModeKind,
        waterModeValue: outcome.recipe.waterModeValue,
      });
      setCurrentRecipeId(null);
      setRecipeName(DEFAULT_RECIPE_NAME);
      setFileMessage("Recette importée.");
    } else {
      setFileMessage(outcome.message);
    }
  }

  async function handleSave() {
    try {
      const id = await saveRecipe(editor.state, recipeName.trim() || DEFAULT_RECIPE_NAME, currentRecipeId);
      setCurrentRecipeId(id);
      setSavedRecipesRefreshKey((key) => key + 1);
      setFileMessage("Recette enregistrée.");
    } catch (cause) {
      setFileMessage(`Échec de l'enregistrement : ${String(cause)}`);
    }
  }

  async function handleOpenSavedRecipe(id: string) {
    const recipe = await loadRecipe(id);
    if (!recipe) {
      setFileMessage("Cette recette n'existe plus.");
      return;
    }
    editor.loadRecipe({
      ingredients: recipe.ingredients,
      additives: recipe.additives,
      superfatPercent: recipe.superfatPercent,
      lyePurityPercent: recipe.lyePurityPercent,
      waterModeKind: recipe.waterModeKind,
      waterModeValue: recipe.waterModeValue,
    });
    setCurrentRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setFileMessage(`Recette « ${recipe.name} » chargée.`);
  }

  return (
    <div className="recipe-editor">
      <header className="app-header">
        <h1>La Saponnerie</h1>
        <p>Calculateur de recette de savon par saponification à froid</p>

        <div className="field-group">
          <label htmlFor="recipe-name">Nom de la recette</label>
          <input
            id="recipe-name"
            type="text"
            value={recipeName}
            onChange={(event) => setRecipeName(event.currentTarget.value)}
          />
        </div>

        <div className="header-actions">
          <button type="button" onClick={handleSave}>
            Enregistrer
          </button>
          <button type="button" onClick={handleImport}>
            Importer un fichier JSON
          </button>
          <button type="button" onClick={handleExport}>
            Exporter en JSON
          </button>
        </div>
        {fileMessage && (
          <p className="field-hint" role="status">
            {fileMessage}
          </p>
        )}

        <SavedRecipesList onOpen={handleOpenSavedRecipe} refreshKey={savedRecipesRefreshKey} />
      </header>

      <SafetyNotice />

      <div className="recipe-editor-columns">
        <section className="recipe-column" aria-labelledby="recipe-heading">
          <h2 id="recipe-heading">Recette</h2>

          <FatPicker onSelect={editor.addIngredient} />

          <IngredientTable
            ingredients={editor.state.ingredients}
            breakdown={editor.result?.ingredientBreakdown ?? null}
            onMassChange={editor.setIngredientMass}
            onBeeswaxPercentChange={editor.setBeeswaxPercent}
            onRemove={editor.removeIngredient}
            onMove={editor.moveIngredient}
          />

          <div className="field-group">
            <label htmlFor="superfat">Surgras (%)</label>
            <input
              id="superfat"
              type="text"
              inputMode="decimal"
              value={editor.state.superfatPercent}
              onChange={(event) => editor.setSuperfatPercent(event.currentTarget.value)}
            />
          </div>

          <div className="field-group">
            <label htmlFor="lye-purity">Pureté de la soude (%)</label>
            <input
              id="lye-purity"
              type="text"
              inputMode="decimal"
              value={editor.state.lyePurityPercent}
              onChange={(event) => editor.setLyePurityPercent(event.currentTarget.value)}
            />
          </div>

          <WaterModeSelector
            kind={editor.state.waterModeKind}
            value={editor.state.waterModeValue}
            onChange={editor.setWaterMode}
          />

          <AdditiveTable
            additives={editor.state.additives}
            onAdd={editor.addAdditiveRow}
            onRemove={editor.removeAdditiveRow}
            onNameChange={editor.setAdditiveName}
            onCategoryChange={editor.setAdditiveCategory}
            onMassChange={editor.setAdditiveMass}
          />
        </section>

        <section className="results-column" aria-labelledby="results-heading">
          <h2 id="results-heading">Résultats</h2>
          <ResultsPanel
            result={editor.result}
            errors={editor.errors}
            isComplete={editor.isComplete}
            isCalculating={editor.isCalculating}
            additivesTotalMass={editor.additivesTotalMass}
          />
        </section>
      </div>
    </div>
  );
}

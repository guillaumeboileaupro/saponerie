import { useState } from "react";
import { AdditiveTable } from "./AdditiveTable";
import { BeeswaxControl } from "./BeeswaxControl";
import { FatPicker } from "./FatPicker";
import { IngredientTable } from "./IngredientTable";
import { fatsDatasetVersion } from "./fatsCatalog";
import { exportRecipeToFile, importRecipeFromFile } from "./recipeFile";
import { loadRecipe, saveRecipe } from "./recipeStorage";
import { ResultsPanel } from "./ResultsPanel";
import { SafetyNotice } from "./SafetyNotice";
import { SavedRecipesList } from "./SavedRecipesList";
import { computeBeeswaxMass, isBeeswaxRow } from "./state";
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
  const beeswaxRow = editor.state.ingredients.find(isBeeswaxRow);
  const hasOils = editor.state.ingredients.some((row) => !isBeeswaxRow(row));
  const beeswaxMass = beeswaxRow && hasOils
    ? computeBeeswaxMass(editor.state.ingredients, beeswaxRow)
    : null;

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
        <div className="brand-lockup">
          <img className="brand-logo" src="/logo.svg" alt="" width="58" height="40" />
          <div>
            <h1>La Saponnerie</h1>
            <p>Atelier de formulation</p>
          </div>
        </div>
        <details className="recipe-library">
          <summary>Recettes et fichiers</summary>
          <div className="library-content">
            <div className="field-group recipe-name-field">
              <label htmlFor="recipe-name">Nom de la recette</label>
              <input
                id="recipe-name"
                type="text"
                value={recipeName}
                onChange={(event) => setRecipeName(event.currentTarget.value)}
              />
            </div>
            <div className="header-actions">
              <button type="button" className="primary-button" onClick={handleSave}>Enregistrer</button>
              <button type="button" onClick={handleImport}>Importer JSON</button>
              <button type="button" onClick={handleExport}>Exporter JSON</button>
            </div>
            {fileMessage && <p className="file-message" role="status">{fileMessage}</p>}
            <SavedRecipesList onOpen={handleOpenSavedRecipe} refreshKey={savedRecipesRefreshKey} />
          </div>
        </details>
      </header>

      <div className="recipe-editor-columns">
        <section className="recipe-column" aria-labelledby="recipe-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Étape 1</span>
              <h2 id="recipe-heading">Vos corps gras</h2>
            </div>
            <p>Saisissez uniquement ce que vous pesez.</p>
          </div>

          <FatPicker onSelect={editor.addIngredient} />

          <IngredientTable
            ingredients={editor.state.ingredients}
            breakdown={editor.result?.ingredientBreakdown ?? null}
            onMassChange={editor.setIngredientMass}
            onRemove={editor.removeIngredient}
            onMove={editor.moveIngredient}
          />

          <BeeswaxControl
            percent={beeswaxRow?.beeswaxPercent ?? "4"}
            massGrams={beeswaxMass}
            onChange={(percent) => beeswaxRow && editor.setBeeswaxPercent(beeswaxRow.key, percent)}
          />

          <details className="advanced-panel">
            <summary>Réglages de la recette</summary>
            <div className="settings-grid">
              <div className="field-group">
                <label htmlFor="superfat">Surgras</label>
                <div className="suffix-input">
                  <input id="superfat" type="text" inputMode="decimal" value={editor.state.superfatPercent} onChange={(event) => editor.setSuperfatPercent(event.currentTarget.value)} />
                  <span>%</span>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="lye-purity">Pureté de la soude</label>
                <div className="suffix-input">
                  <input id="lye-purity" type="text" inputMode="decimal" value={editor.state.lyePurityPercent} onChange={(event) => editor.setLyePurityPercent(event.currentTarget.value)} />
                  <span>%</span>
                </div>
              </div>
            </div>
            <WaterModeSelector kind={editor.state.waterModeKind} value={editor.state.waterModeValue} onChange={editor.setWaterMode} />
          </details>

          <details className="advanced-panel">
            <summary>Additifs facultatifs</summary>
            <AdditiveTable additives={editor.state.additives} onAdd={editor.addAdditiveRow} onRemove={editor.removeAdditiveRow} onNameChange={editor.setAdditiveName} onCategoryChange={editor.setAdditiveCategory} onMassChange={editor.setAdditiveMass} />
          </details>
        </section>

        <section className="results-column" aria-labelledby="results-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Étape 2</span>
              <h2 id="results-heading">À peser</h2>
            </div>
            <span className="live-status">Calcul automatique</span>
          </div>
          <ResultsPanel
            result={editor.result}
            errors={editor.errors}
            technicalError={editor.technicalError}
            isComplete={editor.isComplete}
            isCalculating={editor.isCalculating}
            additivesTotalMass={editor.additivesTotalMass}
            beeswaxMass={beeswaxMass}
          />
        </section>
      </div>

      <SafetyNotice />

      <footer className="app-footer">
        Données SAP version {fatsDatasetVersion} · Les sources sont visibles sur chaque huile.
      </footer>
    </div>
  );
}

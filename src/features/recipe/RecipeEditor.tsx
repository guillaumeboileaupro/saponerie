import { useState } from "react";
import { AdditiveTable } from "./AdditiveTable";
import { FatPicker } from "./FatPicker";
import { IngredientTable } from "./IngredientTable";
import { exportRecipeToFile, importRecipeFromFile } from "./recipeFile";
import { ResultsPanel } from "./ResultsPanel";
import { SafetyNotice } from "./SafetyNotice";
import { WaterModeSelector } from "./WaterModeSelector";
import { useRecipeEditor } from "./useRecipeEditor";
import "./recipe-editor.css";

export function RecipeEditor() {
  const editor = useRecipeEditor();
  const [fileMessage, setFileMessage] = useState<string | null>(null);

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
      setFileMessage("Recette importée.");
    } else {
      setFileMessage(outcome.message);
    }
  }

  return (
    <div className="recipe-editor">
      <header className="app-header">
        <h1>La Saponnerie</h1>
        <p>Calculateur de recette de savon par saponification à froid</p>
        <div className="header-actions">
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

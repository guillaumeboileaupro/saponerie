import { FatPicker } from "./FatPicker";
import { IngredientTable } from "./IngredientTable";
import { ResultsPanel } from "./ResultsPanel";
import { SafetyNotice } from "./SafetyNotice";
import { WaterModeSelector } from "./WaterModeSelector";
import { useRecipeEditor } from "./useRecipeEditor";
import "./recipe-editor.css";

export function RecipeEditor() {
  const editor = useRecipeEditor();

  return (
    <div className="recipe-editor">
      <header className="app-header">
        <h1>La Saponnerie</h1>
        <p>Calculateur de recette de savon par saponification à froid</p>
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
        </section>

        <section className="results-column" aria-labelledby="results-heading">
          <h2 id="results-heading">Résultats</h2>
          <ResultsPanel
            result={editor.result}
            errors={editor.errors}
            isComplete={editor.isComplete}
            isCalculating={editor.isCalculating}
          />
        </section>
      </div>
    </div>
  );
}

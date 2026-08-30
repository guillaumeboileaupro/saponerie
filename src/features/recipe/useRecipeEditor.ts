import { useEffect, useMemo, useState } from "react";
import { calculateRecipe } from "../../core/calculateRecipe";
import type { CalculationResult, ValidationError } from "../../core/types";
import { computeAdditivesTotalMass, type AdditiveCategory } from "./additives";
import {
  addAdditive,
  addIngredientRow,
  buildRecipeInput,
  initialRecipeEditorState,
  moveIngredientRow,
  removeAdditive,
  removeIngredientRow,
  replaceRecipe,
  updateAdditive,
  updateBeeswaxPercent,
  updateIngredientMass,
  type RecipeEditorState,
  type WaterModeKind,
} from "./state";

// Anti-rebond léger : la mise à jour reste perçue comme immédiate (§7 de
// docs/PROJECT_CONTEXT.md) tout en évitant un appel IPC à chaque frappe.
const CALCULATION_DEBOUNCE_MS = 200;

export interface RecipeEditorApi {
  state: RecipeEditorState;
  result: CalculationResult | null;
  errors: ValidationError[];
  technicalError: string | null;
  isComplete: boolean;
  isCalculating: boolean;
  additivesTotalMass: string;
  addIngredient: (catalogId: string) => void;
  removeIngredient: (key: string) => void;
  setIngredientMass: (key: string, massGrams: string) => void;
  setBeeswaxPercent: (key: string, percent: string) => void;
  moveIngredient: (key: string, direction: "up" | "down") => void;
  setSuperfatPercent: (value: string) => void;
  setLyePurityPercent: (value: string) => void;
  setWaterMode: (kind: WaterModeKind, value: string) => void;
  addAdditiveRow: () => void;
  removeAdditiveRow: (key: string) => void;
  setAdditiveName: (key: string, name: string) => void;
  setAdditiveCategory: (key: string, category: AdditiveCategory) => void;
  setAdditiveMass: (key: string, massGrams: string) => void;
  loadRecipe: (next: RecipeEditorState) => void;
}

export function useRecipeEditor(): RecipeEditorApi {
  const [state, setState] = useState<RecipeEditorState>(initialRecipeEditorState);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const recipeInput = useMemo(() => buildRecipeInput(state), [state]);
  const isComplete = recipeInput !== null;
  const additivesTotalMass = useMemo(() => computeAdditivesTotalMass(state.additives), [state.additives]);

  useEffect(() => {
    if (!recipeInput) {
      setResult(null);
      setErrors([]);
      setTechnicalError(null);
      return;
    }

    let cancelled = false;
    setIsCalculating(true);

    const timeout = setTimeout(() => {
      void calculateRecipe(recipeInput).then((outcome) => {
        if (cancelled) return;
        if (outcome.ok) {
          setResult(outcome.result);
          setErrors([]);
          setTechnicalError(null);
        } else if (outcome.kind === "validation") {
          setResult(null);
          setErrors(outcome.errors);
          setTechnicalError(null);
        } else {
          setResult(null);
          setErrors([]);
          setTechnicalError(outcome.message);
        }
        setIsCalculating(false);
      });
    }, CALCULATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // recipeInput est recalculé à partir de `state` ; le comparer par
    // référence suffit ici car buildRecipeInput crée un nouvel objet à
    // chaque changement pertinent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(recipeInput)]);

  return {
    state,
    result,
    errors,
    technicalError,
    isComplete,
    isCalculating,
    additivesTotalMass,
    addIngredient: (catalogId) => setState((prev) => addIngredientRow(prev, catalogId)),
    removeIngredient: (key) => setState((prev) => removeIngredientRow(prev, key)),
    setIngredientMass: (key, massGrams) =>
      setState((prev) => updateIngredientMass(prev, key, massGrams)),
    setBeeswaxPercent: (key, percent) =>
      setState((prev) => updateBeeswaxPercent(prev, key, percent)),
    moveIngredient: (key, direction) => setState((prev) => moveIngredientRow(prev, key, direction)),
    setSuperfatPercent: (value) => setState((prev) => ({ ...prev, superfatPercent: value })),
    setLyePurityPercent: (value) => setState((prev) => ({ ...prev, lyePurityPercent: value })),
    setWaterMode: (kind, value) =>
      setState((prev) => ({ ...prev, waterModeKind: kind, waterModeValue: value })),
    addAdditiveRow: () => setState((prev) => addAdditive(prev)),
    removeAdditiveRow: (key) => setState((prev) => removeAdditive(prev, key)),
    setAdditiveName: (key, name) => setState((prev) => updateAdditive(prev, key, { name })),
    setAdditiveCategory: (key, category) =>
      setState((prev) => updateAdditive(prev, key, { category })),
    setAdditiveMass: (key, massGrams) =>
      setState((prev) => updateAdditive(prev, key, { massGrams })),
    loadRecipe: (next) => setState(() => replaceRecipe(next)),
  };
}

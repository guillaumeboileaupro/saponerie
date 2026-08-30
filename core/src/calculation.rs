use rust_decimal::Decimal;

use crate::types::{CalculationResult, IngredientShare, RecipeInput, WaterMode};
use crate::validation::{collect_warnings, validate, ValidationError};

/// Calcule une recette complète : masse totale des corps gras, NaOH
/// théorique, NaOH après surgras et pureté, eau selon la méthode choisie,
/// masse totale estimée, et répartition par ingrédient.
///
/// Renvoie les erreurs de validation sans calculer si la recette n'est pas
/// exploitable (`docs/PROJECT_CONTEXT.md` §6 : aucun résultat exploitable
/// sur une donnée critique invalide).
pub fn calculate(input: &RecipeInput) -> Result<CalculationResult, Vec<ValidationError>> {
    validate(input)?;

    let hundred = Decimal::from(100);

    let total_fat_grams: Decimal = input
        .ingredients
        .iter()
        .map(|ingredient| ingredient.mass_grams)
        .sum();

    // NaOH_i = masse_i × sapNaOH_i ; NaOH_théorique = somme(NaOH_i).
    let theoretical_naoh_grams: Decimal = input
        .ingredients
        .iter()
        .map(|ingredient| ingredient.mass_grams * ingredient.fat.sap_na_oh)
        .sum();

    // NaOH_après_surgras = NaOH_théorique × (1 − s / 100).
    let superfat_factor = Decimal::ONE - (input.superfat_percent / hundred);
    let discounted_naoh_grams = theoretical_naoh_grams * superfat_factor;

    // NaOH_à_peser = NaOH_après_surgras / (p / 100).
    let purity_factor = input.lye_purity_percent / hundred;
    let weighed_naoh_grams = discounted_naoh_grams / purity_factor;

    let water_grams = match input.water_mode {
        WaterMode::Concentration(c) => weighed_naoh_grams * (Decimal::ONE - c) / c,
        WaterMode::WaterLyeRatio(r) => weighed_naoh_grams * r,
        WaterMode::PercentOfOils(w) => total_fat_grams * w / hundred,
    };

    let total_batch_grams = total_fat_grams + weighed_naoh_grams + water_grams;

    let ingredient_breakdown = input
        .ingredients
        .iter()
        .map(|ingredient| IngredientShare {
            fat_id: ingredient.fat.id.clone(),
            mass_grams: ingredient.mass_grams,
            percent_of_oils: if total_fat_grams.is_zero() {
                Decimal::ZERO
            } else {
                ingredient.mass_grams / total_fat_grams * hundred
            },
        })
        .collect();

    let assumptions = vec![
        format!("Surgras appliqué : {} %", input.superfat_percent),
        format!("Pureté de la soude : {} %", input.lye_purity_percent),
        water_mode_assumption(&input.water_mode),
    ];

    let warnings = collect_warnings(input);

    Ok(CalculationResult {
        total_fat_grams,
        theoretical_naoh_grams,
        discounted_naoh_grams,
        weighed_naoh_grams,
        water_grams,
        total_batch_grams,
        ingredient_breakdown,
        assumptions,
        warnings,
    })
}

fn water_mode_assumption(mode: &WaterMode) -> String {
    match mode {
        WaterMode::Concentration(c) => {
            format!("Méthode eau : concentration de solution de soude à {}", c)
        }
        WaterMode::WaterLyeRatio(r) => format!("Méthode eau : ratio eau/soude à {}", r),
        WaterMode::PercentOfOils(w) => format!("Méthode eau : {} % de la masse des corps gras", w),
    }
}

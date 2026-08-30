use rust_decimal::Decimal;

use crate::types::{RecipeInput, WaterMode};

/// Bornes de validation. Voir `docs/PROJECT_CONTEXT.md` §4.6 — proposition
/// à confirmer par Guillaume ; toute modification de ces bornes doit être
/// répercutée dans ce document.
pub mod bounds {
    use rust_decimal::Decimal;

    pub fn superfat_min() -> Decimal {
        Decimal::ZERO
    }
    pub fn superfat_max() -> Decimal {
        Decimal::from(30)
    }
    pub fn superfat_usual_max() -> Decimal {
        Decimal::from(15)
    }

    pub fn lye_purity_usual_min() -> Decimal {
        Decimal::from(90)
    }
    pub fn lye_purity_max() -> Decimal {
        Decimal::from(100)
    }

    pub fn concentration_usual_min() -> Decimal {
        Decimal::new(25, 2) // 0.25
    }
    pub fn concentration_usual_max() -> Decimal {
        Decimal::new(40, 2) // 0.40
    }

    pub fn water_lye_ratio_usual_min() -> Decimal {
        Decimal::ONE
    }
    pub fn water_lye_ratio_usual_max() -> Decimal {
        Decimal::from(3)
    }

    pub fn percent_of_oils_usual_min() -> Decimal {
        Decimal::from(30)
    }
    pub fn percent_of_oils_usual_max() -> Decimal {
        Decimal::from(40)
    }
}

/// Erreur bloquante : la recette n'est pas exploitable tant qu'elle n'est
/// pas corrigée. Aucun résultat ne doit être affiché comme utilisable.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationError {
    EmptyRecipe,
    NonPositiveMass { fat_id: String },
    MissingOrNonPositiveSapNaOH { fat_id: String },
    SuperfatOutOfRange(Decimal),
    LyePurityOutOfRange(Decimal),
    ConcentrationOutOfRange(Decimal),
    WaterLyeRatioOutOfRange(Decimal),
    PercentOfOilsOutOfRange(Decimal),
}

pub fn validate(input: &RecipeInput) -> Result<(), Vec<ValidationError>> {
    let mut errors = Vec::new();

    if input.ingredients.is_empty() {
        errors.push(ValidationError::EmptyRecipe);
    }

    for ingredient in &input.ingredients {
        if ingredient.mass_grams <= Decimal::ZERO {
            errors.push(ValidationError::NonPositiveMass {
                fat_id: ingredient.fat.id.clone(),
            });
        }
        if ingredient.fat.sap_na_oh <= Decimal::ZERO {
            errors.push(ValidationError::MissingOrNonPositiveSapNaOH {
                fat_id: ingredient.fat.id.clone(),
            });
        }
    }

    if input.superfat_percent < bounds::superfat_min()
        || input.superfat_percent > bounds::superfat_max()
    {
        errors.push(ValidationError::SuperfatOutOfRange(input.superfat_percent));
    }

    if input.lye_purity_percent <= Decimal::ZERO
        || input.lye_purity_percent > bounds::lye_purity_max()
    {
        errors.push(ValidationError::LyePurityOutOfRange(
            input.lye_purity_percent,
        ));
    }

    match input.water_mode {
        WaterMode::Concentration(c) => {
            if c <= Decimal::ZERO || c >= Decimal::ONE {
                errors.push(ValidationError::ConcentrationOutOfRange(c));
            }
        }
        WaterMode::WaterLyeRatio(r) => {
            if r <= Decimal::ZERO {
                errors.push(ValidationError::WaterLyeRatioOutOfRange(r));
            }
        }
        WaterMode::PercentOfOils(w) => {
            if w <= Decimal::ZERO || w > Decimal::from(100) {
                errors.push(ValidationError::PercentOfOilsOutOfRange(w));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors)
    }
}

/// Avertissements non bloquants : la recette reste valide mais sort des
/// plages usuelles de la saponification à froid.
pub fn collect_warnings(input: &RecipeInput) -> Vec<String> {
    let mut warnings = Vec::new();

    if input.superfat_percent > bounds::superfat_usual_max() {
        warnings.push(format!(
            "Surgras de {} % au-dessus de la plage usuelle (0–15 %) : vérifier la recette.",
            input.superfat_percent
        ));
    }

    if input.lye_purity_percent < bounds::lye_purity_usual_min() {
        warnings.push(format!(
            "Pureté de soude de {} % en dessous de la plage usuelle (90–100 %) : vérifier l'étiquette du produit.",
            input.lye_purity_percent
        ));
    }

    match input.water_mode {
        WaterMode::Concentration(c) => {
            if c < bounds::concentration_usual_min() || c > bounds::concentration_usual_max() {
                warnings.push(format!(
                    "Concentration de soude {} en dehors de la plage usuelle (0,25–0,40).",
                    c
                ));
            }
        }
        WaterMode::WaterLyeRatio(r) => {
            if r < bounds::water_lye_ratio_usual_min() || r > bounds::water_lye_ratio_usual_max() {
                warnings.push(format!(
                    "Ratio eau/soude {} en dehors de la plage usuelle (1–3).",
                    r
                ));
            }
        }
        WaterMode::PercentOfOils(w) => {
            if w < bounds::percent_of_oils_usual_min() || w > bounds::percent_of_oils_usual_max() {
                warnings.push(format!(
                    "Eau à {} % des corps gras en dehors de la plage usuelle (30–40 %).",
                    w
                ));
            }
        }
    }

    warnings
}

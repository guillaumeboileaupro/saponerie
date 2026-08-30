//! Moteur de calcul pur de La Saponnerie.
//!
//! Ce crate ne dépend ni de l'UI, ni de Tauri, ni du stockage (voir
//! `docs/decisions/0002-langage-moteur-decimal.md`). Toutes les valeurs
//! monétaires/pondérales utilisent `rust_decimal::Decimal` : jamais de
//! flottant binaire dans les calculs métier.

mod calculation;
mod types;
mod validation;

pub use calculation::calculate;
pub use types::{
    CalculationResult, Fat, IngredientShare, RecipeIngredient, RecipeInput, WaterMode,
};
pub use validation::{bounds, collect_warnings, validate, ValidationError};

#[cfg(test)]
mod tests;

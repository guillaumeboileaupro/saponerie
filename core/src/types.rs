use rust_decimal::Decimal;

/// Corps gras utilisé dans une recette, avec son indice SAP NaOH.
///
/// `sap_koh`, quand présent, est conservé pour un futur module savon liquide
/// mais n'est jamais lu par [`crate::calculate`] : NaOH et KOH ne doivent
/// jamais être confondus dans le moteur de calcul actuel.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fat {
    pub id: String,
    pub display_name: String,
    pub sap_na_oh: Decimal,
    pub sap_koh: Option<Decimal>,
}

/// Un corps gras et sa masse dans une recette donnée.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeIngredient {
    pub fat: Fat,
    pub mass_grams: Decimal,
}

/// Méthode de calcul de l'eau. Les trois méthodes ne doivent jamais être
/// mélangées : une recette en choisit une seule, explicitement.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WaterMode {
    /// Concentration `c` de la solution de soude, `0 < c < 1`.
    Concentration(Decimal),
    /// Ratio eau / soude à peser, `r > 0`.
    WaterLyeRatio(Decimal),
    /// Pourcentage `w` de la masse totale des corps gras, `0 < w <= 100`.
    PercentOfOils(Decimal),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeInput {
    pub ingredients: Vec<RecipeIngredient>,
    /// Surgras en pourcentage, ex. `5` pour 5 %.
    pub superfat_percent: Decimal,
    /// Pureté de la soude en pourcentage, ex. `99` pour 99 %.
    pub lye_purity_percent: Decimal,
    pub water_mode: WaterMode,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IngredientShare {
    pub fat_id: String,
    pub mass_grams: Decimal,
    pub percent_of_oils: Decimal,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CalculationResult {
    pub total_fat_grams: Decimal,
    pub theoretical_naoh_grams: Decimal,
    pub discounted_naoh_grams: Decimal,
    pub weighed_naoh_grams: Decimal,
    pub water_grams: Decimal,
    pub total_batch_grams: Decimal,
    pub ingredient_breakdown: Vec<IngredientShare>,
    pub assumptions: Vec<String>,
    pub warnings: Vec<String>,
}

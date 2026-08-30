use std::str::FromStr;

use rust_decimal::Decimal;

use crate::{calculate, validate, Fat, RecipeIngredient, RecipeInput, ValidationError, WaterMode};

fn dec(s: &str) -> Decimal {
    Decimal::from_str(s).unwrap()
}

fn fat(id: &str, sap_na_oh: &str) -> Fat {
    Fat {
        id: id.to_string(),
        display_name: id.to_string(),
        sap_na_oh: dec(sap_na_oh),
        sap_koh: None,
    }
}

fn ingredient(id: &str, sap_na_oh: &str, mass: &str) -> RecipeIngredient {
    RecipeIngredient {
        fat: fat(id, sap_na_oh),
        mass_grams: dec(mass),
    }
}

fn assert_dec_eq(actual: Decimal, expected: &str) {
    assert_eq!(actual, dec(expected), "attendu {expected}, obtenu {actual}");
}

// --- Cas de référence documentaires (docs/PROJECT_CONTEXT.md §11.1) ---

#[test]
fn cas_a_savon_de_base_du_support() {
    let input = RecipeInput {
        ingredients: vec![
            ingredient("tournesol", "0.134", "200"),
            ingredient("olive", "0.134", "320"),
            ingredient("coco", "0.183", "200"),
            ingredient("cire-abeille", "0.069", "30"),
        ],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let result = calculate(&input).expect("recette valide");

    assert_dec_eq(result.total_fat_grams, "750");
    assert_dec_eq(result.theoretical_naoh_grams, "108.35");
    assert_dec_eq(result.discounted_naoh_grams, "102.9325");
    assert_dec_eq(result.weighed_naoh_grams, "102.9325");
    assert_dec_eq(result.water_grams, "262.50");
    assert!(result.warnings.is_empty());
}

#[test]
fn cas_b_shampoing_solide_avec_ricin_de_la_fiche() {
    // La fiche historique utilise 0,134 pour le ricin, alors que le jeu de
    // données courant retient 0,129 (table imprimée, voir docs/SOURCES.md).
    // Ce test fixe explicitement la valeur de la fiche pour la reproduction
    // historique ; il ne doit jamais devenir la valeur par défaut du ricin.
    let input = RecipeInput {
        ingredients: vec![
            ingredient("beurre-cacao", "0.137", "130"),
            ingredient("beurre-karite", "0.128", "100"),
            ingredient("coco", "0.183", "100"),
            ingredient("ricin", "0.134", "50"),
        ],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let result = calculate(&input).expect("recette valide");

    assert_dec_eq(result.total_fat_grams, "380");
    assert_dec_eq(result.theoretical_naoh_grams, "55.61");
    assert_dec_eq(result.discounted_naoh_grams, "52.8295");
    assert_dec_eq(result.water_grams, "133");
}

#[test]
fn cas_c_recette_manuscrite_1() {
    let input = RecipeInput {
        ingredients: vec![
            ingredient("coco", "0.183", "100"),
            ingredient("colza", "0.124", "100"),
            ingredient("beurre-cacao", "0.137", "30"),
            ingredient("tournesol", "0.134", "100"),
            ingredient("cire-abeille", "0.069", "13.2"),
        ],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let result = calculate(&input).expect("recette valide");

    assert_dec_eq(result.total_fat_grams, "343.2");
    // Le document affiche 49,11 g (arrondi ayant probablement sommé une
    // cire d'abeille déjà arrondie à 0,91 g). La valeur non arrondie exacte,
    // que le moteur doit produire, est 49,1208 g — elle arrondit à 49,12 g,
    // pas 49,11 g. C'est exactement le type d'écart que §4.5/§11 demandent
    // de détecter plutôt que de reproduire aveuglément.
    assert_dec_eq(result.theoretical_naoh_grams, "49.1208");
    assert_dec_eq(result.discounted_naoh_grams, "46.66476");
    // Le document indique une eau manuscrite de 120 g tout en reconnaissant
    // que 35 % de 343,2 g donnent 120,12 g : le moteur doit produire la
    // valeur exacte de la formule, pas l'arrondi manuscrit.
    assert_dec_eq(result.water_grams, "120.12");
}

#[test]
fn cas_d_recette_manuscrite_2() {
    let input = RecipeInput {
        ingredients: vec![
            ingredient("colza", "0.124", "84"),
            ingredient("coco", "0.183", "100"),
            ingredient("beurre-cacao", "0.137", "50"),
            ingredient("beurre-karite", "0.128", "50"),
            ingredient("cire-abeille", "0.069", "11.4"),
        ],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let result = calculate(&input).expect("recette valide");

    assert_dec_eq(result.total_fat_grams, "295.4");
    assert_dec_eq(result.theoretical_naoh_grams, "42.7526");
    assert_dec_eq(result.discounted_naoh_grams, "40.614970");
    assert_dec_eq(result.water_grams, "103.39");
}

// --- Un seul corps gras, calculé à la main ---

#[test]
fn un_seul_corps_gras() {
    let input = RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "500")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::WaterLyeRatio(dec("2")),
    };

    let result = calculate(&input).expect("recette valide");

    assert_dec_eq(result.total_fat_grams, "500");
    assert_dec_eq(result.theoretical_naoh_grams, "67"); // 500 * 0.134
    assert_dec_eq(result.discounted_naoh_grams, "67"); // surgras 0 %
    assert_dec_eq(result.weighed_naoh_grams, "67");
    assert_dec_eq(result.water_grams, "134"); // ratio 2 : 67 * 2
    assert_dec_eq(result.total_batch_grams, "701"); // 500 + 67 + 134
}

// --- Surgras 0 %, 5 %, valeur personnalisée ---

#[test]
fn surgras_0_5_et_valeur_personnalisee() {
    let base = |superfat: &str| RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "1000")],
        superfat_percent: dec(superfat),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    assert_dec_eq(calculate(&base("0")).unwrap().discounted_naoh_grams, "134");
    assert_dec_eq(
        calculate(&base("5")).unwrap().discounted_naoh_grams,
        "127.3",
    );
    // 20 % est une valeur personnalisée autorisée par la borne stricte
    // (§4.6 : 0–30 %) mais hors plage usuelle (0–15 %) : elle doit être
    // acceptée avec un avertissement, pas refusée.
    let custom = calculate(&base("20")).unwrap();
    assert_dec_eq(custom.discounted_naoh_grams, "107.2");
    assert!(!custom.warnings.is_empty());
}

// --- Pureté à 100 % et pureté inférieure ---

#[test]
fn purete_100_et_purete_inferieure() {
    let base = |purity: &str| RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "1000")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec(purity),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    assert_dec_eq(calculate(&base("100")).unwrap().weighed_naoh_grams, "134");
    // Pureté 97 % : 134 / 0.97
    let result = calculate(&base("97")).unwrap();
    assert_eq!(result.weighed_naoh_grams, dec("134") / dec("0.97"));
    assert!(
        result.warnings.is_empty(),
        "97 % est dans la plage usuelle 90-100 %"
    );

    // Pureté 80 % : hors plage usuelle mais valide (>0 et <=100).
    let low_purity = calculate(&base("80")).unwrap();
    assert!(!low_purity.warnings.is_empty());
}

// --- Les trois méthodes d'eau ---

#[test]
fn methode_eau_concentration() {
    let input = RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "1000")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::Concentration(dec("0.3")),
    };
    let result = calculate(&input).unwrap();
    // eau = NaOH × (1 − c) / c = 134 × 0.7 / 0.3
    assert_eq!(result.water_grams, dec("134") * dec("0.7") / dec("0.3"));
}

#[test]
fn methode_eau_ratio() {
    let input = RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "1000")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::WaterLyeRatio(dec("2.5")),
    };
    let result = calculate(&input).unwrap();
    assert_dec_eq(result.water_grams, "335"); // 134 * 2.5
}

#[test]
fn methode_eau_pourcentage_corps_gras() {
    let input = RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "1000")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("38")),
    };
    let result = calculate(&input).unwrap();
    assert_dec_eq(result.water_grams, "380"); // 38 % de 1000
}

// --- Ordre des ingrédients sans effet sur le résultat ---

#[test]
fn ordre_des_ingredients_sans_effet() {
    let make = |order: [&str; 3]| {
        let items: Vec<RecipeIngredient> = order
            .iter()
            .map(|id| match *id {
                "olive" => ingredient("olive", "0.134", "300"),
                "coco" => ingredient("coco", "0.183", "200"),
                "ricin" => ingredient("ricin", "0.129", "50"),
                _ => unreachable!(),
            })
            .collect();
        RecipeInput {
            ingredients: items,
            superfat_percent: dec("5"),
            lye_purity_percent: dec("97"),
            water_mode: WaterMode::PercentOfOils(dec("35")),
        }
    };

    let a = calculate(&make(["olive", "coco", "ricin"])).unwrap();
    let b = calculate(&make(["ricin", "olive", "coco"])).unwrap();
    let c = calculate(&make(["coco", "ricin", "olive"])).unwrap();

    assert_eq!(a.total_fat_grams, b.total_fat_grams);
    assert_eq!(a.total_fat_grams, c.total_fat_grams);
    assert_eq!(a.theoretical_naoh_grams, b.theoretical_naoh_grams);
    assert_eq!(a.theoretical_naoh_grams, c.theoretical_naoh_grams);
    assert_eq!(a.weighed_naoh_grams, b.weighed_naoh_grams);
    assert_eq!(a.water_grams, b.water_grams);
    assert_eq!(a.water_grams, c.water_grams);
}

// --- Recette redimensionnée avec conservation des proportions ---

#[test]
fn recette_redimensionnee_conserve_les_proportions() {
    let make = |scale: &str| RecipeInput {
        ingredients: vec![
            ingredient("olive", "0.134", &(dec("300") * dec(scale)).to_string()),
            ingredient("coco", "0.183", &(dec("200") * dec(scale)).to_string()),
        ],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let base = calculate(&make("1")).unwrap();
    let doubled = calculate(&make("2")).unwrap();

    assert_eq!(doubled.total_fat_grams, base.total_fat_grams * dec("2"));
    assert_eq!(
        doubled.theoretical_naoh_grams,
        base.theoretical_naoh_grams * dec("2")
    );
    assert_eq!(
        doubled.weighed_naoh_grams,
        base.weighed_naoh_grams * dec("2")
    );
    assert_eq!(doubled.water_grams, base.water_grams * dec("2"));

    // Les proportions de chaque ingrédient dans le mélange sont inchangées.
    for (b, d) in base
        .ingredient_breakdown
        .iter()
        .zip(doubled.ingredient_breakdown.iter())
    {
        assert_eq!(b.percent_of_oils, d.percent_of_oils);
    }
}

// --- Champs invalides : masse nulle/négative, indice absent, bornes ---

#[test]
fn masse_nulle_ou_negative_rejetee() {
    for mass in ["0", "-10"] {
        let input = RecipeInput {
            ingredients: vec![ingredient("olive", "0.134", mass)],
            superfat_percent: dec("5"),
            lye_purity_percent: dec("100"),
            water_mode: WaterMode::PercentOfOils(dec("35")),
        };
        let errors = calculate(&input).unwrap_err();
        assert!(
            matches!(&errors[0], ValidationError::NonPositiveMass { fat_id } if fat_id == "olive")
        );
    }
}

#[test]
fn recette_vide_rejetee() {
    let input = RecipeInput {
        ingredients: vec![],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };
    let errors = validate(&input).unwrap_err();
    assert!(errors.contains(&ValidationError::EmptyRecipe));
}

#[test]
fn indice_sap_absent_ou_non_positif_rejete() {
    for sap in ["0", "-0.1"] {
        let input = RecipeInput {
            ingredients: vec![ingredient("mystere", sap, "100")],
            superfat_percent: dec("5"),
            lye_purity_percent: dec("100"),
            water_mode: WaterMode::PercentOfOils(dec("35")),
        };
        let errors = calculate(&input).unwrap_err();
        assert!(matches!(
            &errors[0],
            ValidationError::MissingOrNonPositiveSapNaOH { fat_id } if fat_id == "mystere"
        ));
    }
}

#[test]
fn surgras_hors_bornes_strictes_rejete() {
    for superfat in ["-1", "31"] {
        let input = RecipeInput {
            ingredients: vec![ingredient("olive", "0.134", "100")],
            superfat_percent: dec(superfat),
            lye_purity_percent: dec("100"),
            water_mode: WaterMode::PercentOfOils(dec("35")),
        };
        let errors = calculate(&input).unwrap_err();
        assert!(matches!(&errors[0], ValidationError::SuperfatOutOfRange(_)));
    }
}

#[test]
fn purete_invalide_rejetee() {
    for purity in ["0", "-5", "101"] {
        let input = RecipeInput {
            ingredients: vec![ingredient("olive", "0.134", "100")],
            superfat_percent: dec("5"),
            lye_purity_percent: dec(purity),
            water_mode: WaterMode::PercentOfOils(dec("35")),
        };
        let errors = calculate(&input).unwrap_err();
        assert!(matches!(
            &errors[0],
            ValidationError::LyePurityOutOfRange(_)
        ));
    }
}

#[test]
fn parametres_eau_incoherents_rejetes() {
    let with_mode = |mode: WaterMode| RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "100")],
        superfat_percent: dec("5"),
        lye_purity_percent: dec("100"),
        water_mode: mode,
    };

    for c in ["0", "1", "-0.1", "1.5"] {
        let errors = calculate(&with_mode(WaterMode::Concentration(dec(c)))).unwrap_err();
        assert!(matches!(
            &errors[0],
            ValidationError::ConcentrationOutOfRange(_)
        ));
    }

    for r in ["0", "-1"] {
        let errors = calculate(&with_mode(WaterMode::WaterLyeRatio(dec(r)))).unwrap_err();
        assert!(matches!(
            &errors[0],
            ValidationError::WaterLyeRatioOutOfRange(_)
        ));
    }

    for w in ["0", "-5", "101"] {
        let errors = calculate(&with_mode(WaterMode::PercentOfOils(dec(w)))).unwrap_err();
        assert!(matches!(
            &errors[0],
            ValidationError::PercentOfOilsOutOfRange(_)
        ));
    }
}

// --- Confusion SAP KOH / NaOH ---

#[test]
fn le_calcul_najamais_le_sap_koh() {
    let mut olive = fat("olive", "0.134");
    // Une valeur KOH volontairement très différente et absurde si elle
    // était utilisée par erreur à la place de NaOH.
    olive.sap_koh = Some(dec("999"));

    let input = RecipeInput {
        ingredients: vec![RecipeIngredient {
            fat: olive,
            mass_grams: dec("100"),
        }],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };

    let result = calculate(&input).unwrap();
    assert_dec_eq(result.theoretical_naoh_grams, "13.4"); // 100 * 0.134, jamais 100 * 999
}

// --- Stabilité des arrondis / absence de dérive binaire ---

#[test]
fn stabilite_des_arrondis_sans_derive_binaire() {
    // 0.1 + 0.2 est le cas classique de dérive en flottant binaire IEEE-754
    // (0.30000000000000004). Avec rust_decimal, le résultat doit être exact.
    let input = RecipeInput {
        ingredients: vec![ingredient("a", "0.1", "1"), ingredient("b", "0.2", "1")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };
    let result = calculate(&input).unwrap();
    assert_dec_eq(result.theoretical_naoh_grams, "0.3");
}

// --- Contrat de sérialisation JSON (frontière avec l'UI TypeScript) ---
//
// Ces tests figent la forme JSON attendue par src/ (voir docs/decisions/
// 0002-langage-moteur-decimal.md : le moteur reste indépendant de l'UI,
// mais son contrat de sérialisation est un détail public qu'un changement
// de dépendance (ex. mise à jour de rust_decimal ou de serde) pourrait
// casser silencieusement côté TypeScript sans ce test.

#[test]
fn contrat_json_water_mode() {
    let value = WaterMode::PercentOfOils(dec("35"));
    let json = serde_json::to_value(value).unwrap();
    assert_eq!(
        json,
        serde_json::json!({ "mode": "percentOfOils", "value": "35" })
    );
}

#[test]
fn contrat_json_validation_error_avec_champ() {
    let error = ValidationError::NonPositiveMass {
        fat_id: "olive".to_string(),
    };
    let json = serde_json::to_value(error).unwrap();
    assert_eq!(
        json,
        serde_json::json!({ "type": "nonPositiveMass", "details": { "fatId": "olive" } })
    );
}

#[test]
fn contrat_json_calculation_result() {
    let input = RecipeInput {
        ingredients: vec![ingredient("olive", "0.134", "100")],
        superfat_percent: dec("0"),
        lye_purity_percent: dec("100"),
        water_mode: WaterMode::PercentOfOils(dec("35")),
    };
    let result = calculate(&input).unwrap();
    let json = serde_json::to_value(&result).unwrap();

    assert_eq!(json["totalFatGrams"], "100");
    // rust_decimal conserve l'échelle du calcul (0,134 a 3 décimales, donc
    // 100 × 0,134 = "13.400", pas "13.4"). C'est voulu : l'arrondi/l'affichage
    // appartient à la couche UI (§4.5 de docs/PROJECT_CONTEXT.md), jamais au
    // moteur. Ce test fige ce comportement pour que la couche TS ne suppose
    // jamais qu'une chaîne décimale est déjà normalisée.
    assert_eq!(json["theoreticalNaohGrams"], "13.400");
    assert_eq!(json["ingredientBreakdown"][0]["fatId"], "olive");
    assert_eq!(json["ingredientBreakdown"][0]["percentOfOils"], "100");
}

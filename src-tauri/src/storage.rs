//! Stockage local des recettes en SQLite (voir
//! `docs/decisions/0004-stockage-local-migrations.md`). Cette couche ne
//! recalcule rien : elle persiste des chaînes décimales telles que produites
//! par l'éditeur, exactement comme le fait `recipeFile.ts` pour l'export
//! JSON, afin qu'une recette reste reproductible même si le jeu de données
//! SAP évolue plus tard.

use std::path::Path;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

pub struct Database(pub Mutex<Connection>);

/// Migrations appliquées dans l'ordre, une seule fois chacune (suivies dans
/// `schema_migrations`). Ajouter une nouvelle entrée à la fin pour toute
/// évolution de schéma future ; ne jamais modifier une entrée existante une
/// fois publiée.
const MIGRATIONS: &[(&str, &str)] = &[(
    "0001_init",
    "
    CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        superfat_percent TEXT NOT NULL,
        lye_purity_percent TEXT NOT NULL,
        water_mode_kind TEXT NOT NULL,
        water_mode_value TEXT NOT NULL,
        dataset_version TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        fat_id TEXT NOT NULL,
        fat_display_name TEXT NOT NULL,
        sap_na_oh TEXT NOT NULL,
        sap_koh TEXT,
        mass_grams TEXT NOT NULL,
        beeswax_percent TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_additives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        mass_grams TEXT NOT NULL
    );
    ",
)];

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("l'horloge système est antérieure à 1970")
        .as_millis() as i64
}

pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "foreign_keys", true)?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at INTEGER NOT NULL
        );",
    )?;
    for (name, sql) in MIGRATIONS {
        let already_applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE name = ?1)",
            params![name],
            |row| row.get(0),
        )?;
        if already_applied {
            continue;
        }
        conn.execute_batch(sql)?;
        conn.execute(
            "INSERT INTO schema_migrations (name, applied_at) VALUES (?1, ?2)",
            params![name, now_millis()],
        )?;
    }
    Ok(())
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeIngredientRecord {
    pub fat_id: String,
    pub fat_display_name: String,
    #[serde(rename = "sapNaOH")]
    pub sap_na_oh: String,
    #[serde(rename = "sapKOH")]
    pub sap_koh: Option<String>,
    pub mass_grams: String,
    pub beeswax_percent: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeAdditiveRecord {
    pub name: String,
    pub category: String,
    pub mass_grams: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeRecord {
    pub id: Option<String>,
    pub name: String,
    pub superfat_percent: String,
    pub lye_purity_percent: String,
    pub water_mode_kind: String,
    pub water_mode_value: String,
    pub dataset_version: String,
    pub ingredients: Vec<RecipeIngredientRecord>,
    pub additives: Vec<RecipeAdditiveRecord>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeSummary {
    pub id: String,
    pub name: String,
    pub updated_at: i64,
}

pub fn save_recipe(conn: &mut Connection, record: &RecipeRecord) -> rusqlite::Result<String> {
    let tx = conn.transaction()?;
    let now = now_millis();

    let id = match &record.id {
        Some(existing_id) => {
            tx.execute(
                "UPDATE recipes SET name = ?1, superfat_percent = ?2, lye_purity_percent = ?3,
                 water_mode_kind = ?4, water_mode_value = ?5, dataset_version = ?6, updated_at = ?7
                 WHERE id = ?8",
                params![
                    record.name,
                    record.superfat_percent,
                    record.lye_purity_percent,
                    record.water_mode_kind,
                    record.water_mode_value,
                    record.dataset_version,
                    now,
                    existing_id,
                ],
            )?;
            tx.execute(
                "DELETE FROM recipe_ingredients WHERE recipe_id = ?1",
                params![existing_id],
            )?;
            tx.execute(
                "DELETE FROM recipe_additives WHERE recipe_id = ?1",
                params![existing_id],
            )?;
            existing_id.clone()
        }
        None => {
            let new_id = uuid::Uuid::new_v4().to_string();
            tx.execute(
                "INSERT INTO recipes (id, name, superfat_percent, lye_purity_percent,
                 water_mode_kind, water_mode_value, dataset_version, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)",
                params![
                    new_id,
                    record.name,
                    record.superfat_percent,
                    record.lye_purity_percent,
                    record.water_mode_kind,
                    record.water_mode_value,
                    record.dataset_version,
                    now,
                ],
            )?;
            new_id
        }
    };

    for (position, ingredient) in record.ingredients.iter().enumerate() {
        tx.execute(
            "INSERT INTO recipe_ingredients
             (recipe_id, position, fat_id, fat_display_name, sap_na_oh, sap_koh, mass_grams, beeswax_percent)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                id,
                position as i64,
                ingredient.fat_id,
                ingredient.fat_display_name,
                ingredient.sap_na_oh,
                ingredient.sap_koh,
                ingredient.mass_grams,
                ingredient.beeswax_percent,
            ],
        )?;
    }

    for (position, additive) in record.additives.iter().enumerate() {
        tx.execute(
            "INSERT INTO recipe_additives (recipe_id, position, name, category, mass_grams)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                id,
                position as i64,
                additive.name,
                additive.category,
                additive.mass_grams
            ],
        )?;
    }

    tx.commit()?;
    Ok(id)
}

pub fn list_recipes(conn: &Connection) -> rusqlite::Result<Vec<RecipeSummary>> {
    let mut statement =
        conn.prepare("SELECT id, name, updated_at FROM recipes ORDER BY updated_at DESC")?;
    let rows = statement.query_map([], |row| {
        Ok(RecipeSummary {
            id: row.get(0)?,
            name: row.get(1)?,
            updated_at: row.get(2)?,
        })
    })?;
    rows.collect()
}

pub fn load_recipe(conn: &Connection, id: &str) -> rusqlite::Result<Option<RecipeRecord>> {
    let recipe_row = conn.query_row(
        "SELECT id, name, superfat_percent, lye_purity_percent, water_mode_kind, water_mode_value, dataset_version
         FROM recipes WHERE id = ?1",
        params![id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        },
    );

    let (
        id,
        name,
        superfat_percent,
        lye_purity_percent,
        water_mode_kind,
        water_mode_value,
        dataset_version,
    ) = match recipe_row {
        Ok(row) => row,
        Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
        Err(error) => return Err(error),
    };

    let mut ingredient_statement = conn.prepare(
        "SELECT fat_id, fat_display_name, sap_na_oh, sap_koh, mass_grams, beeswax_percent
         FROM recipe_ingredients WHERE recipe_id = ?1 ORDER BY position ASC",
    )?;
    let ingredients = ingredient_statement
        .query_map(params![id], |row| {
            Ok(RecipeIngredientRecord {
                fat_id: row.get(0)?,
                fat_display_name: row.get(1)?,
                sap_na_oh: row.get(2)?,
                sap_koh: row.get(3)?,
                mass_grams: row.get(4)?,
                beeswax_percent: row.get(5)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let mut additive_statement = conn.prepare(
        "SELECT name, category, mass_grams FROM recipe_additives WHERE recipe_id = ?1 ORDER BY position ASC",
    )?;
    let additives = additive_statement
        .query_map(params![id], |row| {
            Ok(RecipeAdditiveRecord {
                name: row.get(0)?,
                category: row.get(1)?,
                mass_grams: row.get(2)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    Ok(Some(RecipeRecord {
        id: Some(id),
        name,
        superfat_percent,
        lye_purity_percent,
        water_mode_kind,
        water_mode_value,
        dataset_version,
        ingredients,
        additives,
    }))
}

pub fn delete_recipe(conn: &Connection, id: &str) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM recipes WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn duplicate_recipe(conn: &mut Connection, id: &str) -> rusqlite::Result<Option<String>> {
    let Some(mut record) = load_recipe(conn, id)? else {
        return Ok(None);
    };
    record.id = None;
    record.name = format!("{} (copie)", record.name);
    let new_id = save_recipe(conn, &record)?;
    Ok(Some(new_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn open_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", true).unwrap();
        run_migrations(&conn).unwrap();
        conn
    }

    fn sample_record() -> RecipeRecord {
        RecipeRecord {
            id: None,
            name: "Savon de test".to_string(),
            superfat_percent: "5".to_string(),
            lye_purity_percent: "99".to_string(),
            water_mode_kind: "percentOfOils".to_string(),
            water_mode_value: "35".to_string(),
            dataset_version: "2026-08-30".to_string(),
            ingredients: vec![
                RecipeIngredientRecord {
                    fat_id: "olive".to_string(),
                    fat_display_name: "Olive".to_string(),
                    sap_na_oh: "0.134".to_string(),
                    sap_koh: None,
                    mass_grams: "320".to_string(),
                    beeswax_percent: None,
                },
                RecipeIngredientRecord {
                    fat_id: "cire-abeille".to_string(),
                    fat_display_name: "Cire d'abeille".to_string(),
                    sap_na_oh: "0.069".to_string(),
                    sap_koh: None,
                    mass_grams: "".to_string(),
                    beeswax_percent: Some("4".to_string()),
                },
            ],
            additives: vec![RecipeAdditiveRecord {
                name: "Argile verte".to_string(),
                category: "argile".to_string(),
                mass_grams: "15".to_string(),
            }],
        }
    }

    #[test]
    fn migrations_creent_les_tables_attendues() {
        let conn = open_test_db();
        let table_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN
                 ('recipes', 'recipe_ingredients', 'recipe_additives')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(table_count, 3);
    }

    #[test]
    fn migrations_sont_idempotentes() {
        let conn = open_test_db();
        // Ré-appliquer les migrations sur une base déjà à jour ne doit rien
        // casser (cas d'une nouvelle version de l'application ouvrant une
        // base existante), condition explicite de l'ADR 0004.
        run_migrations(&conn).unwrap();
    }

    #[test]
    fn sauvegarde_puis_chargement_conserve_toutes_les_donnees() {
        let mut conn = open_test_db();
        let id = save_recipe(&mut conn, &sample_record()).unwrap();

        let loaded = load_recipe(&conn, &id)
            .unwrap()
            .expect("la recette doit exister");
        assert_eq!(loaded.name, "Savon de test");
        assert_eq!(loaded.ingredients.len(), 2);
        assert_eq!(loaded.ingredients[0].fat_id, "olive");
        assert_eq!(loaded.ingredients[0].mass_grams, "320");
        assert_eq!(loaded.ingredients[1].fat_id, "cire-abeille");
        assert_eq!(loaded.ingredients[1].beeswax_percent.as_deref(), Some("4"));
        assert_eq!(loaded.additives.len(), 1);
        assert_eq!(loaded.additives[0].name, "Argile verte");
    }

    #[test]
    fn enregistrer_a_nouveau_remplace_le_contenu_sans_dupliquer() {
        let mut conn = open_test_db();
        let mut record = sample_record();
        let id = save_recipe(&mut conn, &record).unwrap();

        record.id = Some(id.clone());
        record.name = "Savon de test (modifié)".to_string();
        record.ingredients.pop();
        save_recipe(&mut conn, &record).unwrap();

        let loaded = load_recipe(&conn, &id).unwrap().unwrap();
        assert_eq!(loaded.name, "Savon de test (modifié)");
        assert_eq!(loaded.ingredients.len(), 1);

        let all_recipes = list_recipes(&conn).unwrap();
        assert_eq!(
            all_recipes.len(),
            1,
            "la mise à jour ne doit pas créer de doublon"
        );
    }

    #[test]
    fn lister_les_recettes_renvoie_un_resume() {
        let mut conn = open_test_db();
        save_recipe(&mut conn, &sample_record()).unwrap();
        let mut second = sample_record();
        second.name = "Deuxième recette".to_string();
        save_recipe(&mut conn, &second).unwrap();

        let summaries = list_recipes(&conn).unwrap();
        assert_eq!(summaries.len(), 2);
        assert!(summaries
            .iter()
            .any(|summary| summary.name == "Savon de test"));
        assert!(summaries
            .iter()
            .any(|summary| summary.name == "Deuxième recette"));
    }

    #[test]
    fn dupliquer_cree_une_copie_independante() {
        let mut conn = open_test_db();
        let original_id = save_recipe(&mut conn, &sample_record()).unwrap();

        let copy_id = duplicate_recipe(&mut conn, &original_id).unwrap().unwrap();
        assert_ne!(copy_id, original_id);

        let copy = load_recipe(&conn, &copy_id).unwrap().unwrap();
        assert_eq!(copy.name, "Savon de test (copie)");
        assert_eq!(copy.ingredients.len(), 2);

        // L'original reste inchangé.
        let original = load_recipe(&conn, &original_id).unwrap().unwrap();
        assert_eq!(original.name, "Savon de test");
    }

    #[test]
    fn dupliquer_une_recette_absente_renvoie_none() {
        let mut conn = open_test_db();
        assert_eq!(duplicate_recipe(&mut conn, "id-inexistant").unwrap(), None);
    }

    #[test]
    fn supprimer_efface_la_recette_et_ses_lignes_filles() {
        let mut conn = open_test_db();
        let id = save_recipe(&mut conn, &sample_record()).unwrap();

        delete_recipe(&conn, &id).unwrap();

        assert_eq!(load_recipe(&conn, &id).unwrap(), None);
        let ingredient_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = ?1",
                params![id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(
            ingredient_count, 0,
            "la suppression en cascade doit retirer les ingrédients"
        );
    }

    #[test]
    fn charger_une_recette_absente_renvoie_none() {
        let conn = open_test_db();
        assert_eq!(load_recipe(&conn, "id-inexistant").unwrap(), None);
    }
}

mod recipe_files;
mod storage;

use recipe_files::{ecrire_fichier_recette, lire_fichier_recette};
use saponerie_core::{calculate, CalculationResult, RecipeInput, ValidationError};
use storage::{Database, RecipeRecord, RecipeSummary};
use tauri::Manager;

/// Calcule une recette côté Rust et renvoie le résultat (ou les erreurs de
/// validation) à l'interface. Aucune logique métier n'est dupliquée côté
/// TypeScript : cette commande est le seul point d'entrée du moteur pour
/// l'UI (voir docs/decisions/0002-langage-moteur-decimal.md).
#[tauri::command]
fn calculer_recette(input: RecipeInput) -> Result<CalculationResult, Vec<ValidationError>> {
    calculate(&input)
}

#[tauri::command]
fn sauvegarder_recette(
    db: tauri::State<Database>,
    recette: RecipeRecord,
) -> Result<String, String> {
    let mut conn = db.0.lock().map_err(|error| error.to_string())?;
    storage::save_recipe(&mut conn, &recette).map_err(|error| error.to_string())
}

#[tauri::command]
fn lister_recettes(db: tauri::State<Database>) -> Result<Vec<RecipeSummary>, String> {
    let conn = db.0.lock().map_err(|error| error.to_string())?;
    storage::list_recipes(&conn).map_err(|error| error.to_string())
}

#[tauri::command]
fn charger_recette(db: tauri::State<Database>, id: String) -> Result<Option<RecipeRecord>, String> {
    let conn = db.0.lock().map_err(|error| error.to_string())?;
    storage::load_recipe(&conn, &id).map_err(|error| error.to_string())
}

#[tauri::command]
fn dupliquer_recette(db: tauri::State<Database>, id: String) -> Result<Option<String>, String> {
    let mut conn = db.0.lock().map_err(|error| error.to_string())?;
    storage::duplicate_recipe(&mut conn, &id).map_err(|error| error.to_string())
}

#[tauri::command]
fn supprimer_recette(db: tauri::State<Database>, id: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|error| error.to_string())?;
    storage::delete_recipe(&conn, &id).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let db_path = app_data_dir.join("recettes.sqlite3");
            let connection = storage::open(&db_path)?;
            app.manage(Database(std::sync::Mutex::new(connection)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            calculer_recette,
            sauvegarder_recette,
            lister_recettes,
            charger_recette,
            dupliquer_recette,
            supprimer_recette,
            lire_fichier_recette,
            ecrire_fichier_recette,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

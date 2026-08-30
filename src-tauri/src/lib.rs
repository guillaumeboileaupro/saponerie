use saponerie_core::{calculate, CalculationResult, RecipeInput, ValidationError};

/// Calcule une recette côté Rust et renvoie le résultat (ou les erreurs de
/// validation) à l'interface. Aucune logique métier n'est dupliquée côté
/// TypeScript : cette commande est le seul point d'entrée du moteur pour
/// l'UI (voir docs/decisions/0002-langage-moteur-decimal.md).
#[tauri::command]
fn calculer_recette(input: RecipeInput) -> Result<CalculationResult, Vec<ValidationError>> {
    calculate(&input)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![calculer_recette])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

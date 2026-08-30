//! Lecture/écriture du fichier de recette choisi par l'utilisateur via la
//! boîte de dialogue native (`@tauri-apps/plugin-dialog`).
//!
//! Volontairement PAS implémenté via `tauri-plugin-fs` : ce plugin exigerait
//! une portée statique (`$HOME/**` ou similaire) accordée en permanence à la
//! webview, alors que le seul besoin réel est de lire/écrire le fichier
//! précis que l'utilisateur vient de désigner. Une commande Tauri classique
//! n'a pas besoin d'une telle portée : le chemin transite depuis la boîte de
//! dialogue (choix explicite de l'utilisateur) jusqu'ici, sans jamais être
//! une capacité générale accordée au contenu web.

use std::path::Path;

/// Une recette raisonnable tient sur quelques dizaines de kilo-octets ; ce
/// plafond n'existe que pour éviter qu'un fichier corrompu ou hostile
/// n'épuise la mémoire avant même la validation structurelle côté
/// TypeScript (défense en profondeur).
const MAX_RECIPE_FILE_BYTES: u64 = 5 * 1024 * 1024;

fn has_json_extension(path: &str) -> bool {
    Path::new(path)
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.eq_ignore_ascii_case("json"))
        .unwrap_or(false)
}

#[tauri::command]
pub fn lire_fichier_recette(chemin: String) -> Result<String, String> {
    if !has_json_extension(&chemin) {
        return Err("Seuls les fichiers .json sont acceptés.".to_string());
    }
    let metadata = std::fs::metadata(&chemin).map_err(|error| error.to_string())?;
    if metadata.len() > MAX_RECIPE_FILE_BYTES {
        return Err(format!(
            "Fichier trop volumineux ({} octets, maximum {} octets).",
            metadata.len(),
            MAX_RECIPE_FILE_BYTES
        ));
    }
    std::fs::read_to_string(&chemin).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn ecrire_fichier_recette(chemin: String, contenu: String) -> Result<(), String> {
    if !has_json_extension(&chemin) {
        return Err("Seuls les fichiers .json sont acceptés.".to_string());
    }
    std::fs::write(&chemin, contenu).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refuse_une_extension_non_json_en_lecture() {
        let result = lire_fichier_recette("/tmp/quelque-chose.txt".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn refuse_une_extension_non_json_en_ecriture() {
        let result = ecrire_fichier_recette("/tmp/quelque-chose.txt".to_string(), "{}".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn ecrit_puis_relit_le_meme_contenu() {
        let path =
            std::env::temp_dir().join(format!("saponerie-test-{}.json", uuid::Uuid::new_v4()));
        let path_str = path.to_string_lossy().to_string();

        ecrire_fichier_recette(path_str.clone(), "{\"exemple\":true}".to_string()).unwrap();
        let content = lire_fichier_recette(path_str).unwrap();

        assert_eq!(content, "{\"exemple\":true}");
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn lecture_d_un_fichier_absent_renvoie_une_erreur() {
        let path =
            std::env::temp_dir().join(format!("saponerie-absent-{}.json", uuid::Uuid::new_v4()));
        let result = lire_fichier_recette(path.to_string_lossy().to_string());
        assert!(result.is_err());
    }

    #[test]
    fn refuse_un_fichier_trop_volumineux() {
        let path =
            std::env::temp_dir().join(format!("saponerie-trop-gros-{}.json", uuid::Uuid::new_v4()));
        let path_str = path.to_string_lossy().to_string();
        let oversized_content = "0".repeat((MAX_RECIPE_FILE_BYTES + 1) as usize);
        std::fs::write(&path, &oversized_content).unwrap();

        let result = lire_fichier_recette(path_str);

        std::fs::remove_file(&path).ok();
        assert!(result.is_err());
    }
}

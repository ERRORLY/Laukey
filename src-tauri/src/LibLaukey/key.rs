// so the functions would be are
//
// create_pass_key     - will generate pass key, that user will have
//                       to enter before revealing password.
// is_pass_key_correct - will check pass key if its correct or not

use serde::{Deserialize, Serialize};
use std::fs;
use directories::ProjectDirs;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

#[derive(Serialize, Deserialize, Debug)]
struct Settings {
    master_password_hash: String,
}

#[tauri::command]
pub fn has_master_key() -> bool {
    let proj_dirs = directories::ProjectDirs::from("", "", "er.local.laukey")
        .expect("Cannot determine system home/appdata directory");
    let path = proj_dirs.data_dir();
    let key_path = path.join("settings.json");
    key_path.exists()
}

#[tauri::command]
pub fn create_master_key(master_password: String) -> Result<(), String> {
    let proj_dirs = ProjectDirs::from("", "", "er.local.laukey")
        .expect("Cannot determine system home/appdata directory");
    let path = proj_dirs.data_dir();
    fs::create_dir_all(path).expect("Not able to create Laukey folder");
    let key_path = path.join("settings.json");

    // make a new hash and put into that
    if !key_path.exists() {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(&master_password.into_bytes(), &salt)
            .expect("not able to hash password")
            .to_string();

        let settings = Settings {
            master_password_hash: password_hash,
        };

        let settings_strings = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
        fs::write(&key_path, settings_strings).map_err(|e| e.to_string())?;
    } else {
        return Err(format!("Path already exist"));
    }

    Ok(())
}

#[tauri::command]
pub fn verify_master_key(master_password: String) -> Result<bool, String> {
    // obtain the hash from settings.json
    let proj_dirs = ProjectDirs::from("", "", "er.local.laukey")
        .expect("Cannot determine system home/appdata directory");
    let path = proj_dirs.data_dir();
    fs::create_dir_all(path).expect("Not able to create Laukey folder");
    let key_path = path.join("settings.json");

    let settings_data = fs::read_to_string(&key_path).map_err(|e| e.to_string())?;
    let data: Settings = serde_json::from_str(&settings_data).map_err(|e| e.to_string())?;

    // check if its true
    let parsed_hash = PasswordHash::new(&data.master_password_hash)
        .expect("not able to create password hash from stored");
    let ok = Argon2::default()
        .verify_password(master_password.as_bytes(), &parsed_hash)
        .is_ok();

    Ok(ok) // return true or false
}

#[tauri::command]
pub fn reset_vault() -> Result<(), String> {
    let proj_dirs = directories::ProjectDirs::from("", "", "er.local.laukey")
        .expect("Cannot determine system home/appdata directory");
    let path = proj_dirs.data_dir();

    // settings.json
    let key_path = path.join("settings.json");
    if key_path.exists() {
        let _ = std::fs::remove_file(&key_path);
    }

    // passwords.db
    let db_path = path.join("passwords.db");
    if db_path.exists() {
        let _ = std::fs::remove_file(&db_path);
    }

    // logo directory
    let logo_dir = path.join("logo");
    if logo_dir.exists() {
        let _ = std::fs::remove_dir_all(&logo_dir);
    }

    Ok(())
}

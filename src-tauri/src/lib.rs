use aes_gcm::{
    aead::{Aead, KeyInit},
    AeadCore, Aes256Gcm, Nonce,
};
use base64;
use csv::ReaderBuilder;
use keyring::Entry;
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Result};

// ------------------- Key handling -------------------

//when building change these variables please, i will ask this directly from app in the next version.
const KEYRING_SERVICE: &str = "PLEASE_CHANGE_THIS_WHEN_BUILDING";
const KEYRING_USER: &str = "SAME_WITH_THIS";

/// Get or create a 32-byte AES key stored securely in OS keyring.
fn get_or_create_key() -> std::result::Result<Vec<u8>, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Failed to open keyring: {e}"))?;

    // Try to read existing key
    if let Ok(encoded) = entry.get_password() {
        let decoded = base64::decode(&encoded)
            .map_err(|e| format!("Failed to decode key from keyring: {e}"))?;
        if decoded.len() == 32 {
            return Ok(decoded);
        }
    }

    // No key found — generate and store
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    let encoded = base64::encode(&key);
    entry
        .set_password(&encoded)
        .map_err(|e| format!("Failed to save key to keyring: {e}"))?;
    Ok(key.to_vec())
}

// ------------------- File paths -------------------

fn get_enc_file_path(app: &AppHandle) -> std::result::Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {e}"))?;
    }
    Ok(app_data_dir.join("passwords.enc"))
}

fn get_nonce_file_path(app: &AppHandle) -> std::result::Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir)
            .map_err(|e| format!("Failed to create app data dir: {e}"))?;
    }
    Ok(app_data_dir.join("passwords.nonce"))
}

// ------------------- Commands -------------------

#[tauri::command]
fn save_pass(passwords: &str, app: AppHandle) -> Result<()> {
    let enc_path = get_enc_file_path(&app)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    let nonce_path = get_nonce_file_path(&app)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    let key = get_or_create_key()
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    let cipher = Aes256Gcm::new_from_slice(&key).expect("key must be 32 bytes");

    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher.encrypt(&nonce, passwords.as_bytes())
        .map_err(|_| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, "Encryption failed")))?;

    fs::write(enc_path, &ciphertext)?;
    fs::write(nonce_path, &nonce)?;

    println!("Passwords encrypted and saved!");
    Ok(())
}

#[tauri::command]
fn get_db(app: AppHandle) -> String {
    let enc_path = match get_enc_file_path(&app) {
        Ok(p) => p,
        Err(_) => return "[]".to_string(),
    };
    let nonce_path = match get_nonce_file_path(&app) {
        Ok(p) => p,
        Err(_) => return "[]".to_string(),
    };

    let ciphertext = match fs::read(enc_path) {
        Ok(d) => d,
        Err(_) => return "[]".to_string(),
    };
    let nonce_bytes = match fs::read(nonce_path) {
        Ok(d) => d,
        Err(_) => return "[]".to_string(),
    };

    let key = match get_or_create_key() {
        Ok(k) => k,
        Err(_) => return "[]".to_string(),
    };
    let cipher = match Aes256Gcm::new_from_slice(&key) {
        Ok(c) => c,
        Err(_) => return "[]".to_string(),
    };

    let nonce = Nonce::from_slice(&nonce_bytes);
    match cipher.decrypt(nonce, ciphertext.as_ref()) {
        Ok(plain) => String::from_utf8_lossy(&plain).to_string(),
        Err(_) => "[]".to_string(),
    }
}

// ------------------- Records -------------------

#[derive(Debug, Serialize, Deserialize)]
struct PasswordRecord {
    id: u32,
    website: String,
    username: String,
    password: String,
    category: String,
    favorite: bool,
    notes: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CsvRecord {
    #[serde(default)]
    id: u32,
    #[serde(rename(deserialize="name"))]
    website: String,
    username: String,
    password: String,
    #[serde(default="default_category")]
    category: String,
    #[serde(default)]
    favorite: bool,
    #[serde(rename(deserialize="note"))]
    notes: String,
}

fn default_category() -> String {
    "General".to_string()
}

#[tauri::command]
fn read_csv_file(file_path: String, app: AppHandle) -> Vec<PasswordRecord> {
    // Load existing records
    let json_str = get_db(app.clone());
    let existing_records: Vec<PasswordRecord> =
        serde_json::from_str(&json_str).unwrap_or_else(|_| vec![]);

    let mut used_ids: HashSet<u32> = existing_records.iter().map(|r| r.id).collect();
    
    // Create a set of existing websites+usernames to check for duplicates
    let mut existing_entries: HashSet<(String, String)> = existing_records
        .iter()
        .map(|r| (r.website.to_lowercase(), r.username.to_lowercase()))
        .collect();

    let mut new_records = Vec::new();

    // Read CSV
    let mut reader = match ReaderBuilder::new().from_path(&file_path) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Failed to open CSV: {e}");
            return new_records; // Return only new records (empty in this case)
        }
    };

    for result in reader.deserialize() {
        let csv_record: CsvRecord = match result {
            Ok(r) => r,
            Err(e) => {
                eprintln!("Failed to parse CSV row: {e}");
                continue;
            }
        };

        // Check for duplicates based on website + username combination
        let entry_key = (csv_record.website.to_lowercase(), csv_record.username.to_lowercase());
        if existing_entries.contains(&entry_key) {
            eprintln!("Skipping duplicate entry: {} - {}", csv_record.website, csv_record.username);
            continue;
        }

        // Generate unique ID
        let mut new_id = 1;
        while used_ids.contains(&new_id) {
            new_id += 1;
        }
        used_ids.insert(new_id);
        existing_entries.insert(entry_key);

        let record = PasswordRecord {
            id: new_id,
            website: csv_record.website,
            username: csv_record.username,
            password: csv_record.password,
            category: csv_record.category,
            favorite: csv_record.favorite,
            notes: csv_record.notes,
        };
        new_records.push(record);
    }
    
    new_records // Return only the new records to be added
}
// ------------------- Tauri entry -------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())

        .invoke_handler(tauri::generate_handler![
            save_pass,
            get_db,
            read_csv_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

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
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager, Result};
use zeroize::Zeroize;
use dotenv::dotenv;
use std::env;

// ------------------- Key handling -------------------

// change these value when you are building or even if you just downloaded the code, you should change this
const KEYRING_SERVICE: &str = "KEYRING_SERVICE";
const KEYRING_USER: &str = "KEYRING_USER";

// Drop From memory if the value is not been used
struct SecureKey(Vec<u8>);

impl SecureKey {
    fn as_slice(&self) -> &[u8] {
        &self.0
    }
}

impl Drop for SecureKey {
    fn drop(&mut self) {
        self.0.zeroize();
    }
}

/// Get or create a 32-byte AES key stored securely in OS keyring.
fn get_or_create_key() -> std::result::Result<SecureKey, String> {
    let entry = Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Failed to open keyring: {e}"))?;

    // Try to read existing key
    if let Ok(encoded) = entry.get_password() {
        let mut decoded = base64::decode(&encoded)
            .map_err(|e| format!("Failed to decode key from keyring: {e}"))?;
        
        if decoded.len() == 32 {
            let secure_key = SecureKey(decoded.clone());
            decoded.zeroize(); // Clear the temporary buffer
            return Ok(secure_key);
        }
        decoded.zeroize(); // Clear invalid key data
    }

    // No key found — generate and store
    let mut key = vec![0u8; 32];
    OsRng.fill_bytes(&mut key);
    
    let encoded = base64::encode(&key);
    entry
        .set_password(&encoded)
        .map_err(|e| {
            // FIXED: Clear sensitive data on error
            key.zeroize();
            format!("Failed to save key to keyring: {e}")
        })?;
    
    Ok(SecureKey(key))
}

// ------------------- File paths -------------------

// FIXED: Added path validation to prevent directory traversal
fn validate_and_get_app_data_dir(app: &AppHandle) -> std::result::Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))?;
    
    // Ensure the path is absolute and within expected bounds
    let canonical_dir = app_data_dir.canonicalize()
        .or_else(|_| {
            // If canonicalize fails (dir doesn't exist), create it first
            fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app data dir: {e}"))?;
            app_data_dir.canonicalize()
                .map_err(|e| format!("Failed to canonicalize app data dir: {e}"))
        })?;
    
    Ok(canonical_dir)
}

fn get_enc_file_path(app: &AppHandle) -> std::result::Result<PathBuf, String> {
    let app_data_dir = validate_and_get_app_data_dir(app)?;
    Ok(app_data_dir.join("passwords.enc"))
}

fn get_nonce_file_path(app: &AppHandle) -> std::result::Result<PathBuf, String> {
    let app_data_dir = validate_and_get_app_data_dir(app)?;
    Ok(app_data_dir.join("passwords.nonce"))
}

// FIXED: Secure file operations with proper error handling
fn secure_write_file<P: AsRef<Path>>(path: P, contents: &[u8]) -> std::result::Result<(), String> {
    // Write to temporary file first, then atomic rename
    let temp_path = path.as_ref().with_extension("tmp");
    
    fs::write(&temp_path, contents)
        .map_err(|e| format!("Failed to write temporary file: {e}"))?;
    
    fs::rename(&temp_path, &path)
        .map_err(|e| {
            // Clean up temp file on error
            let _ = fs::remove_file(&temp_path);
            format!("Failed to finalize file write: {e}")
        })?;
    
    Ok(())
}

// ------------------- Commands -------------------

#[tauri::command]
fn save_pass(passwords: &str, app: AppHandle) -> Result<()> {
    // FIXED: Input validation
    if passwords.is_empty() {
        return Err(tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput, 
            "Password data cannot be empty"
        )));
    }
    
    // FIXED: Length check to prevent excessive memory usage
    if passwords.len() > 10_000_000 { // 10MB limit
        return Err(tauri::Error::Io(std::io::Error::new(
            std::io::ErrorKind::InvalidInput, 
            "Password data too large"
        )));
    }

    let enc_path = get_enc_file_path(&app)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    let nonce_path = get_nonce_file_path(&app)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    let key = get_or_create_key()
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    let cipher = Aes256Gcm::new_from_slice(key.as_slice()).expect("key must be 32 bytes");

    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
    let ciphertext = cipher.encrypt(&nonce, passwords.as_bytes())
        .map_err(|_| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, "Encryption failed")))?;

    // FIXED: Use secure file writing
    secure_write_file(&enc_path, &ciphertext)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    secure_write_file(&nonce_path, &nonce)
        .map_err(|e| tauri::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

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

    // FIXED: Validate nonce length
    if nonce_bytes.len() != 12 { // AES-GCM nonce is 12 bytes
        eprintln!("Invalid nonce length: {}", nonce_bytes.len());
        return "[]".to_string();
    }

    let key = match get_or_create_key() {
        Ok(k) => k,
        Err(_) => return "[]".to_string(),
    };
    let cipher = match Aes256Gcm::new_from_slice(key.as_slice()) {
        Ok(c) => c,
        Err(_) => return "[]".to_string(),
    };

    let nonce = Nonce::from_slice(&nonce_bytes);
    match cipher.decrypt(nonce, ciphertext.as_ref()) {
        Ok(mut plain) => {
            let result = String::from_utf8_lossy(&plain).to_string();
            plain.zeroize(); // FIXED: Clear decrypted data from memory
            result
        },
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

// FIXED: Added input validation and sanitization
fn sanitize_string(input: &str) -> String {
    // Remove null bytes and limit length
    input.replace('\0', "").chars().take(1000).collect()
}

fn validate_csv_path(file_path: &str) -> std::result::Result<PathBuf, String> {
    let path = Path::new(file_path);
    
    // Check if path exists and is a file
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    if !path.is_file() {
        return Err("Path is not a file".to_string());
    }
    
    // Check file extension
    if let Some(ext) = path.extension() {
        if ext.to_string_lossy().to_lowercase() != "csv" {
            return Err("File must have .csv extension".to_string());
        }
    } else {
        return Err("File must have .csv extension".to_string());
    }
    
    // Get canonical path to prevent directory traversal
    path.canonicalize()
        .map_err(|e| format!("Failed to canonicalize path: {e}"))
}

#[tauri::command]
fn read_csv_file(file_path: String, app: AppHandle) -> Vec<PasswordRecord> {
    // FIXED: Validate file path
    let validated_path = match validate_csv_path(&file_path) {
        Ok(path) => path,
        Err(e) => {
            eprintln!("Invalid file path: {e}");
            return Vec::new();
        }
    };

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
    let mut processed_count = 0;
    const MAX_RECORDS: usize = 10000; // Prevent resource exhaustion

    // Read CSV
    let mut reader = match ReaderBuilder::new()
        .flexible(false) // FIXED: Strict CSV parsing
        .from_path(&validated_path) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Failed to open CSV: {e}");
            return new_records;
        }
    };

    for result in reader.deserialize() {
        if processed_count >= MAX_RECORDS {
            eprintln!("Maximum record limit reached ({}), stopping import", MAX_RECORDS);
            break;
        }
        processed_count += 1;

        let mut csv_record: CsvRecord = match result {
            Ok(r) => r,
            Err(e) => {
                eprintln!("Failed to parse CSV row: {e}");
                continue;
            }
        };

        // FIXED: Sanitize input data
        csv_record.website = sanitize_string(&csv_record.website);
        csv_record.username = sanitize_string(&csv_record.username);
        csv_record.password = sanitize_string(&csv_record.password);
        csv_record.category = sanitize_string(&csv_record.category);
        csv_record.notes = sanitize_string(&csv_record.notes);

        // FIXED: Validate required fields
        if csv_record.website.is_empty() || csv_record.username.is_empty() {
            eprintln!("Skipping record with empty website or username");
            continue;
        }

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
    
    println!("Successfully imported {} new records", new_records.len());
    new_records
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
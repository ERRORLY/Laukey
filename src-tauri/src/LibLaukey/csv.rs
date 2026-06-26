// import_pass_from_csv - will import every psaswords from csv
// export_pass_to_csv - will export all the db passwords to csv (do this in frontend, for easy file sharing)

use crate::LibLaukey::{
    db::{see_db, take_connection, does_db_exists},
    pass_encrypt::{decrypt, encrypt},
};
use tokio;
use tauri::Emitter;

#[derive(Debug, serde::Deserialize)]
pub struct Password {
    pub name: String,
    pub url: String,
    pub username: String,
    pub password: String,
    pub note: String,
}

#[derive(Debug, serde::Serialize)]
pub struct ImportResult {
    pub imported: usize,
    pub skipped: usize,
}

#[tauri::command]
pub async fn import_pass_from_csv(app_handle: tauri::AppHandle, master_key: String, path: String) -> Result<ImportResult, String> {
    // spawn_blocking moves CPU-bound / heavy synchronous I/O off the main thread
    tokio::task::spawn_blocking(move || {
        let mut rdr = csv::Reader::from_path(&path).map_err(|e| e.to_string())?;
        does_db_exists().map_err(|e| e.to_string())?;
        let mut conn = take_connection().map_err(|e| e.to_string())?;

        // 1. Start a transaction. This keeps database operations in-memory until committed.
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        let mut imported = 0;
        let mut skipped = 0;

        {
            // Prepare the statement once outside the loop for better performance
            let mut stmt = tx
                .prepare("INSERT INTO passwords (name, url, username, password, note) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT (name, username) DO NOTHING;")
                .map_err(|e| e.to_string())?;

            for result in rdr.deserialize() {
                let record: Password = result.map_err(|e| e.to_string())?;
                let encrypted_pass = encrypt(&master_key, &record.password);

                let rows_affected = stmt.execute((
                    &record.name,
                    &record.url,
                    &record.username,
                    &encrypted_pass,
                    &record.note,
                ))
                .map_err(|e| e.to_string())?;

                if rows_affected == 0 {
                    skipped += 1;
                } else {
                    imported += 1;
                }
            }
        } // stmt goes out of scope here so we can commit the transaction

        // 2. Commit everything to disk in one single operation
        tx.commit().map_err(|e| e.to_string())?;
        app_handle
            .emit("passwords-imported", ())
            .map_err(|e| e.to_string())?;

        Ok(ImportResult { imported, skipped })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn export_pass_to_csv(master_key: String) -> Result<String, String> {
    let passwords = see_db().map_err(|e| e.to_string())?;

    let mut wtr = csv::Writer::from_writer(vec![]);

    wtr.write_record(&["name", "url", "username", "password", "note"])
        .map_err(|e| e.to_string())?;

    for vec_pass in passwords {
        for password in vec_pass {
            let decrypted_pass = decrypt(&master_key, &password.password);

            wtr.write_record(&[
                &password.name,
                &password.url,
                &password.username,
                &decrypted_pass,
                &password.note,
            ])
            .map_err(|e| e.to_string())?;
        }
    }

    let csv_content = String::from_utf8(wtr.into_inner().map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    Ok(csv_content)
}

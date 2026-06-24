// import_pass_from_csv - will import every psaswords from csv
// export_pass_to_csv - will export all the db passwords to csv (do this in frontend, for easy file sharing)

use crate::LibLaukey::{
    db::{add_passwords, see_db},
    pass_encrypt::encrypt,
};

#[derive(Debug, serde::Deserialize)]
pub struct Password {
    pub name: String,
    pub url: String,
    pub username: String,
    pub password: String,
    pub note: String,
}

#[tauri::command]
pub fn import_pass_from_csv(master_key: String, path: String) -> Result<(), String> {
    let mut rdr = csv::Reader::from_path(&path).map_err(|e| e.to_string())?;

    for result in rdr.deserialize() {
        let record: Password = result.map_err(|e| e.to_string())?;
        let encrypt_password = encrypt(&master_key, &record.password);
        let _ = add_passwords(
            master_key.clone(),
            record.name,
            record.url,
            record.username,
            encrypt_password,
            record.note,
        );
    }

    Ok(())
}

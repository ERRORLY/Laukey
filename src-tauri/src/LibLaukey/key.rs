// so the functions would be are
//
// create_pass_key     - will generate pass key, that user will have
//                       to enter before revealing password.
// is_pass_key_correct - will check pass key if its correct or not

use dirs::config_dir;
use serde::{Deserialize, Serialize};
use std::fs;

use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};

#[derive(Serialize, Deserialize, Debug)]
struct Settings {
    master_password_hash: String,
}

pub fn create_pass_key(master_password: String) -> std::io::Result<()> {
    // get to the dirs
    let mut path = config_dir().expect("Cannot find directory");
    path.push("laukey");
    fs::create_dir_all(&path)?;
    path.push("settings.json");

    // make a new hash and put into that
    if !path.exists() {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(&master_password.into_bytes(), &salt)
            .expect("not able to hash password")
            .to_string();

        let settings = Settings {
            master_password_hash: password_hash,
        };

        let settings_strings = serde_json::to_string_pretty(&settings)?;
        fs::write(&path, settings_strings)?;
    } else {
        todo!() // give an error
    }

    Ok(())
}

pub fn is_master_password_correct(master_password: String) -> std::io::Result<bool> {
    // obtain the hash from settings.json
    let mut path = config_dir().expect("Cannot find directory");
    path.push("laukey");
    fs::create_dir_all(&path)?;
    path.push("settings.json");

    let settings_data = fs::read_to_string(&path)?;
    let data: Settings = serde_json::from_str(&settings_data)?;

    // check if its true
    let parsed_hash = PasswordHash::new(&data.master_password_hash)
        .expect("not able to create password hash from stored");
    let ok = Argon2::default()
        .verify_password(master_password.as_bytes(), &parsed_hash)
        .is_ok();

    Ok(ok) // return true or false
}

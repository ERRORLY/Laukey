// see_db()                            - return the whole database in vec of Password
// add_password()                       - will add password into db
// delete_password(name, username)     - will remove the password from the db

use crate::LibLaukey::pass_encrypt::encrypt;
use dirs::config_dir;
use rusqlite::Connection;
use std::fs;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Password {
    pub name: String,
    pub url: String,
    pub username: String,
    pub password: String,
    pub note: String,
}

/// A very simple way to take connection
pub fn take_connection() -> rusqlite::Result<Connection> {
    let mut path = config_dir().expect("Cannot find directory");
    path.push("er.local.laukey");
    fs::create_dir_all(&path).expect("Not Able to make Laukey folder");
    path.push("passwords.db");
    let conn = Connection::open(&path)?;
    Ok(conn)
}

/// it will create a new db if it doesnt exist
pub fn does_db_exists() -> rusqlite::Result<()> {
    let conn = take_connection().expect("Not Able to make db");
    conn.execute(
        "CREATE TABLE IF NOT EXISTS passwords (
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            note TEXT
        )",
        [],
    )?;
    Ok(())
}

/// Will return all the passwords in vec to their names
#[tauri::command]
pub fn see_db() -> Result<Vec<Vec<Password>>, String> {
    does_db_exists().map_err(|e| e.to_string())?;
    let conn = take_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT DISTINCT name FROM passwords")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut passwords: Vec<Vec<Password>> = Vec::new();

    for name in rows {
        let name = name.map_err(|e| e.to_string())?;
        let query = format!(
            "SELECT url, username, password, note FROM passwords WHERE (name='{}')",
            &name
        );
        let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

        let name_password: Vec<Password> = stmt
            .query_map([], |row| {
                Ok(Password {
                    name: name.clone(),
                    url: row.get(0)?,
                    username: row.get(1)?,
                    password: row.get(2)?,
                    note: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())?;

        passwords.push(name_password);
    }

    return Ok(passwords);
}

/// Add passwords inside the db
#[tauri::command]
pub fn add_passwords(
    master_key: String,
    name: String,
    url: String,
    username: String,
    password: String,
    note: String,
) -> Result<(), String> {
    let encrypted_pass = encrypt(&master_key, &password);
    let password = Password {
        name: name,
        url: url,
        username: username,
        password: encrypted_pass,
        note: note,
    };

    let _ = does_db_exists().map_err(|e| e.to_string())?;
    let conn = take_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO passwords (name, url, username, password, note) VALUES (?1, ?2, ?3, ?4, ?5)",
        (
            &password.name,
            &password.url,
            &password.username,
            &password.password,
            &password.note,
        ),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// Delete passwords from the db
pub fn delete_password(name: String, username: String) -> rusqlite::Result<()> {
    does_db_exists()?;
    let conn = take_connection()?;

    conn.execute(
        "DELETE FROM passwords WHERE name=(?1) AND username=(?2)",
        (name, username),
    )?;

    Ok(())
}

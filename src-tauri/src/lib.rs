mod LibLaukey;

pub use LibLaukey::db::add_passwords;
pub use LibLaukey::db::delete_password;
pub use LibLaukey::db::see_db;
pub use LibLaukey::db::update_password;
pub use LibLaukey::pass_encrypt::decrypt;
pub use LibLaukey::csv::import_pass_from_csv;
pub use LibLaukey::csv::export_pass_to_csv;
pub use LibLaukey::key::reset_vault;
pub use LibLaukey::key::has_master_key;
pub use LibLaukey::key::create_master_key;
pub use LibLaukey::key::verify_master_key;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            see_db,
            add_passwords,
            decrypt,
            delete_password,
            update_password,
            import_pass_from_csv,
            export_pass_to_csv,
            has_master_key,
            create_master_key,
            verify_master_key,
            reset_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

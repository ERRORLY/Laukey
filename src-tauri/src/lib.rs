mod lib_laukey;

pub use lib_laukey::csv::export_pass_to_csv;
pub use lib_laukey::csv::import_pass_from_csv;
pub use lib_laukey::db::add_passwords;
pub use lib_laukey::db::delete_password;
pub use lib_laukey::db::see_db;
pub use lib_laukey::db::update_password;
pub use lib_laukey::key::create_master_key;
pub use lib_laukey::key::has_master_key;
pub use lib_laukey::key::reset_vault;
pub use lib_laukey::key::verify_master_key;
pub use lib_laukey::pass_encrypt::decrypt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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

mod LibLaukey;

pub use LibLaukey::db::add_passwords;
pub use LibLaukey::db::delete_password;
pub use LibLaukey::db::see_db;
pub use LibLaukey::db::update_password;
pub use LibLaukey::pass_encrypt::decrypt;
pub use LibLaukey::csv::import_pass_from_csv;
pub use LibLaukey::csv::export_pass_to_csv;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            see_db,
            add_passwords,
            decrypt,
            delete_password,
            update_password,
            import_pass_from_csv,
            export_pass_to_csv
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

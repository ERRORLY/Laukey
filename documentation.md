> Documentation and code is under construction

# Welcome to the documentation of How lawkey works.

All the rust code is written in `stc-tauri/src`, especially in lib.rs and react code is written in `src/Components/Lauki.tsx`.

## How to build from source code.
```
git clone https://github.com/ERRORLY/Laukey.git
cd Laukey
npm i 
npm run tauri build
```

After this your application will be ready in src-tauri/target/release/bundle, the file there will be of either .msi, setup.exe, .exe or .appimage, .deb, .rpm depending on your OS

## How to Run Through Code.
```
git clone https://github.com/ERRORLY/Laukey.git
cd Laukey
npm i 
npm run tauri dev
```

## Backend Overview – Laukey

Laukey's backend is built with **Rust** using **Tauri v2**, which enables a secure and lightweight desktop application environment. The backend handles secure storage and retrieval of passwords, using encryption and OS-native secure storage.

### File Structure

- **Rust backend**: `stc-tauri/src/lib.rs`
- **Frontend (React)**: `src/Components/Laukey.tsx`

---

### Core Backend Functions

| Function        | Description |
|----------------|-------------|
| `save_pass`     | Triggered when a password is added, edited, or removed. It encrypts and saves the updated data. |
| `get_db`        | Fetches the encrypted password database and decrypts it when the app runs or when exporting data. |
| `read_csv_file` | Used to import passwords from a CSV file into the local database, avoiding duplicates. |

---

### 🔑 Security Notes

- **AES-256-GCM** is used to encrypt password data.
- The encryption key is stored securely using the OS **keyring**.
- Data is stored in the filesystem only **after encryption** for safety.

---

## Frontend Overview – Laukey

The frontend is built using **React**, and it serves as the user interface for managing and viewing password data securely and efficiently.

### File Structure

- **Main frontend code**: `src/Components/Laukey.tsx`

---

### Key Functionalities

| Feature         | Description |
|----------------|-------------|
| **CSV Import**  | Allows users to import password data from a CSV file. |
| **CSV Export**  | Enables exporting all saved passwords as a CSV file. |
| **Check for Update** | Connects to Laukey's website to check for newer app versions. |
| **Display & UI** | Lists passwords, categories, favorites, etc., in a clean and organized layout. |

---

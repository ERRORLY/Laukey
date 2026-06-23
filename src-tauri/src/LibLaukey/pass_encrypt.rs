use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose, Engine as _};
use rand::Rng;
use sha2::{Digest, Sha256};

pub fn key_from_password(password: &str) -> [u8; 32] {
    let hash = Sha256::digest(password.as_bytes());

    let mut key = [0u8; 32];
    key.copy_from_slice(&hash);
    key
}

pub fn encrypt(master_password: &str, plaintext: &str) -> String {
    let key = key_from_password(master_password);

    let cipher = Aes256Gcm::new_from_slice(&key).unwrap();

    let mut nonce_bytes = [0u8; 12];
    rand::rng().fill(&mut nonce_bytes);

    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes()).unwrap();

    let mut output = Vec::new();
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&ciphertext);

    general_purpose::STANDARD.encode(output)
}

pub fn decrypt(master_password: &str, encrypted: &str) -> String {
    let encrypted_bytes = general_purpose::STANDARD.decode(encrypted).unwrap();

    let key = key_from_password(master_password);

    let cipher = Aes256Gcm::new_from_slice(&key).unwrap();

    let (nonce_bytes, ciphertext) = encrypted_bytes.split_at(12);

    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher.decrypt(nonce, ciphertext).unwrap();

    String::from_utf8(plaintext).unwrap()
}

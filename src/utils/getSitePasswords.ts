import { invoke } from "@tauri-apps/api/core";

interface PasswordEntry {
  name: string;
  url: string;
  username: string;
  password?: string;
  note?: string;
}

export default async function getSitePasswords(siteName: string | undefined): Promise<PasswordEntry[]> {
  if (!siteName) return [];
  try {
    const result = await invoke<PasswordEntry[][]>("see_db");
    console.log(result);
    for (let i = 0; i < result.length; i++) {
      if (result[i] && result[i][0] && result[i][0].name === siteName) {
        return result[i];
      }
    }
  } catch (error) {
    console.error("Failed to get site passwords:", error);
  }
  return [];
}

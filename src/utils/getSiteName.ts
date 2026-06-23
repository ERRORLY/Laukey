// [[{},{}],[{},{}]]

import { invoke } from "@tauri-apps/api/core";

interface PasswordEntry {
  name: string;
  url: string;
  username: string;
  password?: string;
  note?: string;
}

export interface SiteInfo {
  name: string;
  url: string;
}

export default async function getSiteName(): Promise<SiteInfo[]> {
  const sites: SiteInfo[] = [];

  try {
    const result = await invoke<PasswordEntry[][]>("see_db");
    for (let i = 0; i < result.length; i++) {
      if (result[i] && result[i][0]) {
        sites.push({
          name: result[i][0].name,
          url: result[i][0].url,
        });
      }
    }
  } catch (error) {
    console.error("Failed to get site names:", error);
  }

  return sites;
}

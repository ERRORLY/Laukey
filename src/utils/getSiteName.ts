// [[{},{}],[{},{}]]

import { invoke } from "@tauri-apps/api/core";

export default async function getSiteName() {
  let siteName = [];

  let result = await invoke("see_db");
  for (let i = 0; i < result.length; i++) {
    siteName.push(result[i][0]["name"]);
  }

  return siteName;
}

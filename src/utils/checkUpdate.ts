import Laukey from "../laukey.ts";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { showToast } from "../components/Toast.tsx";

export default async function checkUpdate() {
  try {
    const response = await tauriFetch(Laukey.checkUrl, {
      method: "GET",
    });

    if (!response.ok) {
      showToast.error("Not Able To Fetch Info");
      return;
    }

    const data = await response.json();
    const latestVersion = data.latestVersion.split(".");
    const laukeyVersion = Laukey.version.split(".");

    if (latestVersion[0] > laukeyVersion[0]) {
      return { status: true, downloadUrl: data.downloadUrl };
    } else if (latestVersion[1] > laukeyVersion[1]) {
      return { status: true, downloadUrl: data.downloadUrl };
    }

    return { status: false };
  } catch (err) {
    console.error(err);
    return { status: false };
  }
}

import { getCurrentWindow } from "@tauri-apps/api/window";

export const applyThemeToWindow = async (theme: "light" | "dark") => {
  try {
    const win = getCurrentWindow();
    await win.setTheme(theme);
    const bgHex = theme === "dark" ? "#0b0f19" : "#f2f4f7";
    await win.setBackgroundColor(bgHex);
  } catch (err) {
    console.error("Failed to apply theme to window:", err);
  }
};

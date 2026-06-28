import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../store.ts";
import { showToast } from "./Toast.tsx";
import { openUrl } from "@tauri-apps/plugin-opener";
import checkUpdate from "../utils/checkUpdate.ts";
import { applyThemeToWindow } from "../utils/theme.ts";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });
  const [downloadVersion, setDownloadVersion] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const { masterKey } = useAppStore();

  if (!isOpen) return null;

  const handleImportPassword = async () => {
    try {
      const selected = await open({
        multiple: false, // Set to true if you want to allow multiple files
        directory: false, // We want files, not directories
        filters: [
          {
            name: "CSV Documents",
            extensions: ["csv"], // Restricts selection to .csv files
          },
        ],
      });

      if (selected != null) {
        console.log(selected);
        const result = await invoke<{ imported: number; skipped: number }>(
          "import_pass_from_csv",
          {
            masterKey: masterKey,
            path: selected,
          },
        );
        if (result.skipped > 0) {
          showToast.success(
            `Import complete: ${result.imported} imported (${result.skipped} duplicates skipped)`,
          );
        } else {
          showToast.success(
            `Imported ${result.imported} passwords successfully!`,
          );
        }
      }
    } catch (e) {
      console.error("error:", e);
      showToast.error("Failed to import passwords");
    }
  };

  const handleExportPassword = async () => {
    try {
      const filePath = await save({
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
        defaultPath: "Laukey Passwords.csv", // Suggested default file name
      });

      if (!filePath) {
        console.log("Path not selected");
        return;
      }
      let csvContent = await invoke<string>("export_pass_to_csv", {
        masterKey: masterKey,
      });

      await writeTextFile(filePath, csvContent);
      showToast.success("Passwords exported successfully!");
    } catch (e) {
      console.log("Error:", e);
      showToast.error("Failed to export passwords");
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      showToast.success("Switched to dark theme");
    } else {
      document.documentElement.classList.remove("dark");
      showToast.success("Switched to light theme");
    }
    applyThemeToWindow(newTheme);
  };

  const handleCheckForUpdate = async () => {
    const newVersion = await checkUpdate();
    if (newVersion && newVersion.status) {
      showToast.success("New Version is available");
      setDownloadVersion(true);
      if (newVersion.downloadUrl) {
        setDownloadUrl(newVersion.downloadUrl);
      }
    } else {
      showToast.success("You are already using the Latest Version");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white dark:bg-slate-900 theme-border rounded-2xl w-full max-w-md shadow-2xl relative z-10 transform scale-100 transition-all duration-305 flex flex-col animate-[in_0.2s_ease-out] p-6 gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#175ddc] dark:text-blue-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Appearance Theme */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Appearance Theme
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Light Mode Option */}
            <button
              onClick={() => handleThemeChange("light")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                theme === "light"
                  ? "border-[#175ddc] bg-blue-50/20 text-[#175ddc] dark:bg-blue-950/10 shadow-xs font-semibold"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-955/10 flex items-center justify-center text-amber-500 border border-amber-200/40 dark:border-amber-900/30">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38 1.59 1.59M3 12h2.25m13.5 0H21M5.81 18.19l1.59-1.59m12.38-12.38 1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
                  />
                </svg>
              </div>
              <span className="text-sm">Light Mode</span>
            </button>

            {/* Dark Mode Option */}
            <button
              onClick={() => handleThemeChange("dark")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-[#175ddc] dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/25 text-[#175ddc] dark:text-blue-400 shadow-xs font-semibold"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-600 dark:text-blue-400 border border-slate-200/50 dark:border-slate-800">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              </div>
              <span className="text-sm">Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Import / Export Section */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Import/Export Passwords
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal">
              Backup your vault or import passwords from a .csv document.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleImportPassword}
              className="cursor-pointer font-semibold text-sm rounded-xl border border-gray-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 transition-all shadow-xs"
            >
              Import CSV
            </button>
            <button
              onClick={handleExportPassword}
              className="cursor-pointer font-semibold text-sm rounded-xl text-white bg-[#175ddc] hover:bg-[#114ab8] dark:bg-blue-600 dark:hover:bg-blue-500 py-2.5 transition-all shadow-xs"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Update Section */}
        <div className="flex flex-col bg-white dark:bg-slate-900">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Check for Updates
            </h3>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Check if a newer version of the Laukey is available.
            </p>

            <button
              onClick={handleCheckForUpdate}
              className="cursor-pointer shrink-0 rounded-xl bg-[#175ddc] hover:bg-[#114ab8] dark:bg-blue-600 dark:hover:bg-blue-500 px-12 py-2.5 text-sm font-semibold text-white "
            >
              Check Update
            </button>
          </div>
          {downloadVersion && (
            <div className="mt-4 flex items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/20 text-slate-700 dark:text-slate-350 animate-fade-in shadow-xs">
              <div className="flex gap-3">
                <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100/50 dark:bg-blue-900/30 text-[#175ddc] dark:text-blue-400">
                  <svg
                    className="w-5 h-5 animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Update Available!
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    A new version of Laukey is ready.
                  </span>
                </div>
              </div>
              <button
                onClick={() => openUrl(downloadUrl)}
                className="cursor-pointer shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#175ddc] hover:bg-[#114ab8] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-xs"
              >
                Download
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

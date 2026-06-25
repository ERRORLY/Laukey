import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  if (!isOpen) return null;

  const handleImportPassword = async () => {
    try {
      console.log("Clicked");
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
        await invoke("import_pass_from_csv", {
          masterKey: "Hello",
          path: selected,
        });
        console.log("Done");
      }
    } catch (e) {
      console.error("error:", e);
    }
  };

  const handleExportPassword = async () => {
    return;
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative z-10 transform scale-100 transition-all duration-305 flex flex-col animate-[in_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#175ddc] dark:text-blue-450"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* Content */}
        <div className="px-6 py-3 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ">
              Import/Export Passwords
            </h3>
            <p className="text-sm text-gray-500 font-light mb-3">
              Importing or Exporting of Passwords require .csv file
            </p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <button
                onClick={handleImportPassword}
                className="cursor-pointer font-semibold text-md rounded-lg border-2 border-gray-300 dark:border-gray-700 transition hover:border-gray-400 dark:hover:border-gray-800 py-2"
              >
                Import
              </button>
              <button
                onClick={handleExportPassword}
                className="cursor-pointer font-semibold text-md rounded-lg text-white bg-blue-600 transition hover:bg-blue-700 py-2"
              >
                Export
              </button>
            </div>
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Appearance Theme
            </h3>
            <p className="text-sm text-gray-500 font-light mb-3">
              Change the theme of Laukey as you desire
            </p>
            <div className="grid grid-cols-2 gap-4">
              {/* Light Mode Option */}
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-[#175ddc] bg-blue-50/20 text-[#175ddc] dark:bg-blue-950/10 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
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
                <span className="font-semibold text-sm">Light Mode</span>
              </button>

              {/* Dark Mode Option */}
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-[#175ddc] dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/25 text-[#175ddc] dark:text-blue-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-blue-400">
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
                <span className="font-semibold text-sm">Dark Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-5 py-2 bg-[#175ddc] hover:bg-[#114ab8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

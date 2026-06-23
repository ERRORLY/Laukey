import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import getSitePasswords from "../utils/getSitePasswords.ts";
import PasswordsCard from "../components/PasswordsCard.tsx";
import { exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface PasswordEntry {
  name: string;
  url: string;
  username: string;
  password?: string;
  note?: string;
}

const Passwords = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [logoPath, setLogoPath] = useState(null);

  const [sitePassword, setSitePassword] = useState<PasswordEntry[]>([]);

  useEffect(() => {
    const getLogoPath = async () => {
      const appData = await appDataDir();

      const logoName = `${name}.png`;
      const hasLogoFile = await exists(`logo/${logoName}`, {
        baseDir: BaseDirectory.AppData,
      });
      let logoUrl: string | null = null;
      if (hasLogoFile) {
        const logoPath = await join(appData, "logo", logoName);
        logoUrl = convertFileSrc(logoPath);
      }
      setLogoPath(logoUrl);
    };
    const fetchPasswords = async () => {
      let passwords = await getSitePasswords(name);
      setSitePassword(passwords);
    };
    getLogoPath();
    fetchPasswords();

    // for listening from backend
    const unlistenPromise = listen("passwords-changed", () => {
      fetchPasswords();
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [name]);

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#010103] flex flex-col font-sans text-gray-800 dark:text-slate-300 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800/80 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              title="Go Back"
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
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
            </button>
            <div className="flex items-center gap-4 min-w-0">
              {/* Logo or Brand Initial Circle Icon */}
              {logoPath ? (
                <div className="flex-shrink-0  flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={logoPath}
                    alt={`${name} logo`}
                    className="w-8 h-8 object-contain"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-550 transition-all duration-200">
                  {/* Generic website globe logo */}
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {name} Passwords
            </h1>
          </div>
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-400 bg-gray-105 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-slate-700">
            {sitePassword.length}{" "}
            {sitePassword.length === 1 ? "credential" : "credentials"}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1 flex flex-col gap-6">
        {sitePassword.length === 0 ? (
          <div className="flex justify-center w-full">
            <div className="p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm w-full max-w-md">
              <div className="bg-gray-50 dark:bg-slate-950 rounded-full p-4 mb-4 text-gray-400 dark:text-slate-500">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                No Credentials Found
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                There are no password items saved for this site.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-start">
            {sitePassword.map((item, index) => (
              <PasswordsCard key={index} password={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Passwords;

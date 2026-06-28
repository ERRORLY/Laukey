import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import getSitePasswords from "../utils/getSitePasswords.ts";
import PasswordsCard from "../components/PasswordsCard.tsx";
import { exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Key } from "lucide-react";

interface PasswordEntry {
  name: string;
  url: string;
  username: string;
  password?: string;
  note?: string;
}

const Passwords = () => {
  const { name: rawName } = useParams();
  const name = rawName ? decodeURIComponent(rawName) : "";
  const navigate = useNavigate();
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sitePassword, setSitePassword] = useState<PasswordEntry[]>([]);

  const siteUrl = sitePassword[0]?.url || "";
  const fullUrl = siteUrl
    ? siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
      ? siteUrl
      : `https://${siteUrl}`
    : "";
  const displayUrl = siteUrl.replace(/^(https?:\/\/)?(www\.)?/, "");

  useEffect(() => {
    const getLogoPath = async () => {
      try {
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
      } catch (e) {
        console.log("Error:", e);
      }
    };
    const fetchPasswords = async () => {
      let passwords = await getSitePasswords(name);
      setSitePassword(passwords);
      setIsLoading(false);
    };

    const fetchPasswordsAndLogos = async () => {
      try {
        await getLogoPath();
        await fetchPasswords();
      } catch (e) {
        console.error("Error", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPasswordsAndLogos();

    // for listening from backend
    const unlistenPromise = listen("passwords-changed", () => {
      fetchPasswords();
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [name]);

  if (isLoading)
    return (
      <div className="min-h-screen dark:bg-slate-900 flex flex-col items-center justify-center p-12 gap-3 text-slate-400 dark:text-slate-500">
        <Key className="w-8 h-8 text-[#175ddc] animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">
          Loading vault...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] flex flex-col font-sans text-gray-800 dark:text-slate-300 transition-colors duration-200">
      {/* Top Blue Cover Banner (Straight bottom, taller height to allow overlap) */}
      <div className="h-[22vh] min-h-[170px] w-full bg-gradient-to-r from-blue-600 to-[#175ddc] dark:from-blue-700 dark:to-blue-700 relative shadow-sm transition-all duration-200">
        <div className="w-full max-w-6xl mx-auto px-6 py-5 flex items-start justify-between">
          <button
            onClick={() => navigate("/")}
            className="cursor-pointer p-2 hover:bg-white/10 dark:hover:bg-white/10 rounded-lg transition-colors text-white flex items-center justify-center border border-white/10 bg-white/5 backdrop-blur-xs shadow-sm"
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
        </div>
      </div>

      {/* White / Dark bottom sheet section that overlaps the blue cover */}
      <div className="bg-[#f2f4f7] dark:bg-[#0b0f19] rounded-t-[2rem] md:rounded-t-[2.5rem] shadow-[0_-8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)] -mt-10 relative z-10 flex-1 flex flex-col">
        {/* Main Content Area */}
        <main className="max-w-6xl w-full mx-auto px-4 pb-12 flex-1 flex flex-col gap-6 relative">
          {/* Floating Details Card - overlapping the top boundary of the rounded sheet */}
          <div className="-mt-12 relative z-20 w-full flex justify-center">
            <div className="bg-white dark:bg-slate-900 theme-border rounded-2xl p-4 px-6 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col sm:flex-row items-center sm:justify-between gap-4 max-w-xl w-full">
              <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left min-w-0 w-full sm:w-auto">
                {/* Logo or Brand Initial Circle Icon */}
                {logoPath ? (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center p-1 shrink-0">
                    <img
                      src={logoPath}
                      alt={`${name} logo`}
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 flex items-center justify-center text-gray-400 dark:text-slate-500 shadow-xs shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-400 dark:text-slate-500"
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

                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {name} Passwords
                  </h1>
                  {fullUrl && (
                    <button
                      onClick={() => openUrl(fullUrl)}
                      className="text-xs font-semibold text-[#175ddc] dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <span className="truncate max-w-[180px] sm:max-w-xs">
                        {displayUrl}
                      </span>
                      <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
                <span className="text-xs font-semibold text-gray-555 dark:text-slate-400 bg-gray-100 dark:bg-slate-800/85 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/60 shadow-xs">
                  {sitePassword.length}{" "}
                  {sitePassword.length === 1 ? "credential" : "credentials"}
                </span>
              </div>
            </div>
          </div>

          {/* Password Cards / Empty State */}
          {sitePassword.length === 0 ? (
            <div className="flex justify-center w-full mt-4">
              <div className="p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm w-full max-w-md">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-start mt-4">
              {sitePassword.map((item, index) => (
                <PasswordsCard key={index} password={item} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Passwords;

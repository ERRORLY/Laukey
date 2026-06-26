import { useState, useEffect } from "react";
import getSiteName from "../utils/getSiteName.ts";
import { useNavigate } from "react-router-dom";
import { getLogo } from "../utils/getLogo.ts";
import { exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import SettingsModal from "../components/SettingsModal.tsx";
import { listen } from "@tauri-apps/api/event";
import { Key } from "lucide-react";
import useStore from "../store.ts"; // for masterKey

interface SiteItem {
  name: string;
  url: string;
  logoUrl: string | null;
  len: number;
}

const Homepage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [siteItems, setSiteItems] = useState<SiteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSiteNameAndLogo = async () => {
      try {
        const data = await getSiteName(); // [{ name, url }]
        const appData = await appDataDir();

        // Resolve initial logo URLs (if they exist)
        const initialItems: SiteItem[] = await Promise.all(
          data.map(async (site) => {
            const logoName = `${site.name}.png`;
            const hasLogoFile = await exists(`logo/${logoName}`, {
              baseDir: BaseDirectory.AppData,
            });
            let logoUrl: string | null = null;
            if (hasLogoFile) {
              const logoPath = await join(appData, "logo", logoName);
              logoUrl = convertFileSrc(logoPath);
            }
            return {
              name: site.name,
              url: site.url,
              logoUrl: logoUrl,
              len: site.len,
            };
          }),
        );
        setSiteItems(initialItems || []);

        // Trigger background downloads for missing logos
        data.forEach((site) => {
          if (!site.url) return;
          const logoName = `${site.name}.png`;
          exists(`logo/${logoName}`, { baseDir: BaseDirectory.AppData }).then(
            (hasLogoFile) => {
              if (!hasLogoFile) {
                getLogo(site.name, site.url)
                  .then(async () => {
                    // Verify it exists now
                    const checkExists = await exists(`logo/${logoName}`, {
                      baseDir: BaseDirectory.AppData,
                    });
                    if (checkExists) {
                      const logoPath = await join(appData, "logo", logoName);
                      const logoUrl = convertFileSrc(logoPath);
                      setSiteItems((prevItems) =>
                        prevItems.map((item) =>
                          item.name === site.name ? { ...item, logoUrl } : item,
                        ),
                      );
                    }
                  })
                  .catch((err) => {
                    console.error("Failed to fetch logo for", site.name, err);
                  });
              }
            },
          );
        });
      } catch (err) {
        console.error("Failed to fetch site names and logos:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSiteNameAndLogo();

    // for listening from backend
    const unlistenPromise = listen("passwords-imported", () => {
      fetchSiteNameAndLogo();
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const filteredSiteItems = siteItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] flex flex-col font-sans text-gray-800 dark:text-slate-300 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 shadow-xs top-0 z-50 transition-colors duration-200">
        <div className="max-w-4xl w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate("/")}
          >
            {/* Shield with Keyhole Icon inside a gradient box */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-[#175ddc] flex items-center justify-center shadow-xs">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h-2v4h2v-4zm0-3.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              Laukey
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/add")}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-[#175ddc] hover:from-blue-700 hover:to-[#114ab8] text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 shadow-xs hover:shadow-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="cursor-pointer group p-2 hover:bg-gray-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors flex items-center justify-center text-gray-500 dark:text-slate-400"
              title="Settings"
            >
              <svg
                className="w-6 h-6 transition-transform duration-500 group-hover:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.829a1.125 1.125 0 0 1 .26 1.43l-1.297 2.247a1.125 1.125 0 0 1-1.37.491l-1.216-.456c-.356-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.829c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.59 3.94Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col gap-6">
        {/* Title and Summary */}
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              All Passwords
            </h1>
          </div>
          <span className="text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-200/60 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-gray-300/40 dark:border-slate-700/40">
            {siteItems.length} {siteItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 rounded-md px-4 py-2.5 pl-11 text-sm focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#175ddc] text-gray-900 dark:text-white shadow-sm transition-all placeholder-gray-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Vault Items List */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400 dark:text-slate-500">
              <Key className="w-8 h-8 text-[#175ddc] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">
                Loading vault...
              </span>
            </div>
          ) : filteredSiteItems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="bg-gray-50 dark:bg-slate-950 rounded-full p-4 mb-4 text-gray-400 dark:text-slate-500">
                <svg
                  className="w-10 h-10"
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
                {searchQuery
                  ? "No search results found"
                  : "Your vault is empty"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
                {searchQuery
                  ? "Try adjusting your search keywords to find what you're looking for."
                  : "There are no login items saved in your Laukey vault yet. Add or Import passwords to proceed"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate("/add")}
                  className="mt-5 cursor-pointer text-sm font-semibold text-white bg-[#175ddc] hover:bg-[#114ab8] px-4 py-2 rounded-md transition-colors shadow-sm"
                >
                  Create an item
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredSiteItems.map((item, index) => {
                return (
                  <div
                    key={index}
                    onClick={() =>
                      navigate(`/name/${encodeURIComponent(item.name)}`)
                    }
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Logo or Brand Initial Circle Icon */}
                      {item.logoUrl ? (
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden">
                          <img
                            src={item.logoUrl}
                            alt={`${item.name} logo`}
                            className="w-8 h-8 object-contain rounded"
                            onError={() => {
                              // If image fails to load, remove its logoUrl from state to trigger fallback to generic logo
                              setSiteItems((prevItems) =>
                                prevItems.map((pi) =>
                                  pi.name === item.name
                                    ? { ...pi, logoUrl: null }
                                    : pi,
                                ),
                              );
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 transition-all duration-200">
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

                      {/* Details */}
                      <div className="min-w-0">
                        <span className="block font-semibold text-gray-900 dark:text-slate-200 group-hover:text-[#175ddc] dark:group-hover:text-blue-400 transition-colors text-base truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-600 dark:text-slate-400 truncate">
                            Items: {item.len}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Icon */}
                    <div className="flex items-center text-gray-400 group-hover:text-[#175ddc] transition-colors pl-4">
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default Homepage;

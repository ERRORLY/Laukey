import { useState, useEffect } from "react";
import getSiteName from "../utils/getSiteName.ts";
import { useNavigate } from "react-router-dom";
import { getLogo } from "../utils/getLogo.ts";
import { exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";

interface SiteItem {
  name: string;
  url: string;
  logoUrl: string | null;
}

const Homepage = () => {
  const [siteItems, setSiteItems] = useState<SiteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSiteNameAndLogo = async () => {
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
              getLogo(site.url)
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
    };
    fetchSiteNameAndLogo();
  }, []);

  const filteredSiteItems = siteItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f2f4f7] flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Bitwarden-style Logo Icon (Shield with Keyhole) */}
            <svg
              className="w-7 h-7 text-[#175ddc]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h-2v4h2v-4zm0-3.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
            </svg>
            <span className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-1.5">
              Laukey{" "}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/add")}
              className="cursor-pointer bg-[#175ddc] hover:bg-[#114ab8] text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
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
            <button className="cursor-pointer transition delay-150 hover:-rotate-45">
              <img className="h-8 w-8" src="/logos/settings.png" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col gap-6">
        {/* Title and Summary */}
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              All Passwords
            </h1>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-200/60 px-2.5 py-1 rounded-full border border-gray-300/40">
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
            className="w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 pl-11 text-sm focus:outline-none focus:border-[#175ddc] focus:ring-1 focus:ring-[#175ddc] text-gray-900 shadow-sm transition-all placeholder-gray-400"
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {filteredSiteItems.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="bg-gray-50 rounded-full p-4 mb-4 text-gray-400">
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
              <h3 className="text-base font-semibold text-gray-900">
                {searchQuery
                  ? "No search results found"
                  : "Your vault is empty"}
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {searchQuery
                  ? "Try adjusting your search keywords to find what you're looking for."
                  : "There are no login items saved in your Laukey vault yet."}
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
            <div className="divide-y divide-gray-100">
              {filteredSiteItems.map((item, index) => {
                return (
                  <div
                    key={index}
                    onClick={() => navigate(`/name/${item.name}`)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Logo or Brand Initial Circle Icon */}
                      {item.logoUrl ? (
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                          <img
                            src={item.logoUrl}
                            alt={`${item.name} logo`}
                            className="w-7 h-7 object-contain"
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
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 transition-all duration-200">
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
                        <span className="block font-semibold text-gray-900 group-hover:text-[#175ddc] transition-colors text-base truncate">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-600 truncate">
                            Items: 12
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
    </div>
  );
};

export default Homepage;

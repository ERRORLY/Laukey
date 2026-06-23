import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Laukey from "../laukey.ts";

const AddPasswords = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [masterKey] = useState(Laukey.master_password || "Hello");

  // Helper to extract Site Name from URL using parent domain resolution
  const extractSiteName = (urlText: string): string => {
    let cleaned = urlText.trim();
    if (!cleaned) return "";

    // 1. If they are actively typing the protocol, don't try to parse a site name yet
    if (/^https?(:(\/(\/)?)?)?$/i.test(cleaned)) {
      return "";
    }

    // Prepend protocol if missing so URL parser works
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    try {
      const urlObj = new URL(cleaned);
      let hostname = urlObj.hostname.toLowerCase();

      // Remove port if any
      hostname = hostname.split(":")[0];

      // Split by '.'
      const parts = hostname.split(".");
      if (parts.length < 2) {
        return "";
      }

      // Common second-level domains/suffixes
      const commonSuffixes = new Set([
        "co",
        "com",
        "org",
        "net",
        "gov",
        "edu",
        "ac",
        "mil",
      ]);

      let parentIndex = parts.length - 2;

      if (parts.length >= 3) {
        const secondLast = parts[parts.length - 2];
        if (commonSuffixes.has(secondLast)) {
          parentIndex = parts.length - 3;
        } else {
          parentIndex = parts.length - 2;
        }
      }

      if (parentIndex >= 0) {
        const parentDomain = parts[parentIndex];
        // Make sure we didn't extract empty strings or invalid garbage
        if (!parentDomain) return "";
        return parentDomain.charAt(0).toUpperCase() + parentDomain.slice(1);
      }
    } catch (e) {
      // 2. Fixed Fallback Regex: Explicitly handles partial and full protocols safely
      const match = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s\.:]+)/i);
      if (match && match[1]) {
        const found = match[1].toLowerCase();
        // Double check it's not capturing the protocol itself
        if (found === "http" || found === "https") {
          return "";
        }
        return found.charAt(0).toUpperCase() + found.slice(1);
      }
    }
    return "";
  };
  const handleUrlChange = (value: string) => {
    const oldExtracted = extractSiteName(url);
    setUrl(value);
    const extracted = extractSiteName(value);
    if (extracted && (!name || name === oldExtracted)) {
      setName(extracted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || extractSiteName(url) || "Unknown Site";
    try {
      await invoke("add_passwords", {
        masterKey,
        name: finalName,
        url: url.trim() || `https://${finalName.toLowerCase()}.com`,
        username: username.trim(),
        password,
        note: note.trim(),
      });
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] text-gray-800 dark:text-white p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl transition-colors duration-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Add Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500"
          />
          <input
            type="text"
            placeholder="Site Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500"
            required
          />
          <textarea
            placeholder="Notes"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500 resize-none"
            rows={3}
          />
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-lg transition-colors cursor-pointer text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2 bg-[#175ddc] hover:bg-[#114ab8] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer text-sm font-semibold"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPasswords;

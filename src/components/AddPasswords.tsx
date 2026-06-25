import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import Laukey from "../laukey.ts";
import { showToast } from "./Toast.tsx";

const AddPasswords = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editEntry = location.state?.password;

  const [name, setName] = useState(editEntry?.name || "");
  const [url, setUrl] = useState(editEntry?.url || "");
  const [username, setUsername] = useState(editEntry?.username || "");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState(editEntry?.note || "");
  const [masterKey] = useState(Laukey.master_password || "Hello");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const decryptPassword = async () => {
      if (editEntry && editEntry.password) {
        try {
          const decrypted = await invoke("decrypt", {
            masterKey,
            encrypted: editEntry.password,
          });
          setPassword(decrypted as string);
        } catch (err) {
          console.error("Failed to decrypt password for edit:", err);
        }
      }
    };
    decryptPassword();
  }, [editEntry, masterKey]);

  // Helper to extract Site Name (the whole domain) from URL
  const extractSiteName = (urlText: string): string => {
    const cleaned = urlText.trim();
    if (!cleaned) return "";

    const lower = cleaned.toLowerCase();
    // If it is a partial protocol (prefix of http:// or https://), don't extract anything yet
    if ("https://".startsWith(lower) || "http://".startsWith(lower)) {
      return "";
    }

    // Remove protocol
    let domainPart = cleaned.replace(/^(https?:\/\/)?/i, "");

    // Extract everything up to the first /, ?, #, or :
    const match = domainPart.match(/^([^\/\?\s:#]+)/);
    if (match) {
      let domain = match[1].toLowerCase();
      // Strip www. prefix for cleaner domain representation
      domain = domain.replace(/^www\./i, "");
      return domain;
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
      if (editEntry) {
        await invoke("update_password", {
          masterKey,
          name: editEntry.name,
          username: editEntry.username,
          updatedName: finalName,
          updatedUrl: url.trim() || `https://${finalName.toLowerCase()}.com`,
          updatedUsername: username.trim(),
          updatedPassword: password,
          updatedNote: note.trim(),
        });
        showToast.success(`Updated credentials for ${finalName}`);
      } else {
        let success = await invoke("add_passwords", {
          masterKey,
          name: finalName,
          url: url.trim() || `https://${finalName.toLowerCase()}.com`,
          username: username.trim(),
          password,
          note: note.trim(),
        });
        if (!success) {
          showToast.error(
            `Dublicate Password: ${username.trim()} already exists for ${finalName}`,
          );
          navigate(-1);
          return;
        }
        showToast.success(`Added credentials for ${finalName}`);
      }
      navigate(-1);
    } catch (err) {
      console.error(err);
      showToast.error(`Failed to save credentials for ${finalName}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] text-gray-800 dark:text-white p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-md dark:shadow-xl transition-colors duration-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {editEntry ? "Edit Password" : "Add Password"}
        </h1>
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
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-12 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-lg focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-slate-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-350 cursor-pointer focus:outline-none transition-colors"
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? (
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
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.895 7.895L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
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
              onClick={() => navigate(-1)}
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

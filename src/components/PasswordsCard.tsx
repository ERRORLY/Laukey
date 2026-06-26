import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store.ts";
import { showToast } from "./Toast.tsx";

// 1. Define the structure of a single password entry
export interface PasswordEntry {
  name: string;
  url: string;
  username: string;
  password?: string;
  note?: string;
}

// 2. Define the props that the component expects to receive
interface PasswordsCardProps {
  password: PasswordEntry;
}

// 3. Destructure 'password' from the props object
const PasswordsCard = ({ password }: PasswordsCardProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { masterKey } = useAppStore();

  const decryptPass = async (master_key: string, text: string) => {
    let password = await invoke("decrypt", {
      masterKey: master_key,
      encrypted: text,
    });
    return password as string;
  };

  useEffect(() => {
    setDecryptedValue("");
  }, [password.password]);

  useEffect(() => {
    if (showPassword && password.password) {
      decryptPass(masterKey, password.password)
        .then((decrypted) => {
          setDecryptedValue(decrypted);
        })
        .catch((err) => {
          console.error("Failed to decrypt password:", err);
        });
    }
  }, [showPassword, password.password, masterKey]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await invoke("delete_password", {
        name: password.name,
        username: password.username,
      });
      showToast.success(`Deleted credentials for ${password.name}`);
    } catch (err) {
      console.error("Failed to delete password:", err);
      showToast.error("Failed to delete credentials");
    }
  };

  const handleEdit = () => {
    navigate("/add", { state: { password } });
  };

  const handleCopy = async (
    text: string,
    setCopied: (v: boolean) => void,
    isEncrypted: boolean = false,
  ) => {
    try {
      let valueToCopy = text;
      if (isEncrypted) {
        valueToCopy = await decryptPass(masterKey, text);
      }
      await navigator.clipboard.writeText(valueToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showToast.success(
        `${isEncrypted ? "Password" : "Username"} copied to clipboard`,
      );
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast.error(
        `Failed to copy ${isEncrypted ? "password" : "username"}`,
      );
    }
  };

  const displayUrl = password.url
    ? password.url.replace(/^(https?:\/\/)?(www\.)?/, "")
    : "";

  return (
    <>
      <div className="bg-gradient-to-br from-slate-50 to-[#eef4fc] dark:from-slate-900 dark:to-slate-900/60 theme-border rounded-xl shadow-sm p-6 w-full hover:shadow-md transition-all duration-200 flex flex-col gap-4">
        {/* Fields */}
        <div className="flex flex-col gap-3">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Username
              </span>
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 px-2 mb-1 border-slate-200/50 dark:border-slate-800/50">
                <button
                  onClick={handleEdit}
                  className="cursor-pointer rounded-lg text-slate-500 hover:text-[#175ddc] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Edit Entry"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="cursor-pointer rounded-lg  text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Delete Entry"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-slate-950/80 border border-blue-100/60 dark:border-slate-800/60 rounded-lg px-3 py-2 hover:border-[#175ddc]/30 dark:hover:border-blue-500/30 hover:shadow-sm transition-all">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate select-all pr-2">
                {password.username}
              </span>
              <button
                onClick={() =>
                  handleCopy(password.username, setCopiedUsername, false)
                }
                className="p-1.5 text-gray-400 dark:text-slate-550 hover:text-[#175ddc] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer relative flex-shrink-0"
                title="Copy Username"
              >
                {copiedUsername ? (
                  <svg
                    className="w-4 h-4 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
                {copiedUsername && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Password */}
          {password.password && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Password
              </span>
              <div className="flex items-center justify-between bg-white dark:bg-slate-950/80 border border-blue-100/60 dark:border-slate-800/60 rounded-lg px-3 py-2 hover:border-[#175ddc]/30 dark:hover:border-blue-500/30 hover:shadow-sm transition-all">
                <span
                  className={`text-sm font-semibold text-slate-800 dark:text-slate-200 truncate pr-2 ${!showPassword ? "tracking-widest text-[9px] select-none font-mono" : "font-mono"}`}
                >
                  {showPassword
                    ? decryptedValue || "Decrypting..."
                    : "••••••••••••"}
                </span>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-gray-400 dark:text-slate-550 hover:text-slate-665 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
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
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
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
                  <button
                    onClick={() =>
                      handleCopy(
                        password.password || "",
                        setCopiedPassword,
                        true,
                      )
                    }
                    className="p-1.5 text-gray-400 dark:text-slate-550 dark:text-slate-500 hover:text-[#175ddc] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all cursor-pointer relative"
                    title="Copy Password"
                  >
                    {copiedPassword ? (
                      <svg
                        className="w-4 h-4 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                    {copiedPassword && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          {password.note && (
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Notes
              </span>
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-lg p-3 text-sm text-slate-700 dark:text-amber-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                {password.note}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Dialog Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative z-10 transform scale-100 transition-all duration-200 flex flex-col p-6 animate-[in_0.15s_ease-out] gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-450 flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Credentials?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete the credentials for{" "}
                  <span className="font-semibold text-slate-705 dark:text-slate-300 select-all">
                    "{password.username}"
                  </span>{" "}
                  at{" "}
                  <span className="font-semibold text-slate-705 dark:text-slate-300">
                    {password.name}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="cursor-pointer px-4 py-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PasswordsCard;

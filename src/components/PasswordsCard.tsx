import React, { useState } from "react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopy = async (text: string, setCopied: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const displayUrl = password.url
    ? password.url.replace(/^(https?:\/\/)?(www\.)?/, "")
    : "";

  return (
    <div className="bg-gradient-to-br from-slate-50 to-[#eef4fc] border border-blue-100/70 border-l-4 border-l-[#175ddc] rounded-xl shadow-sm p-6 w-full hover:shadow-md transition-all duration-200 flex flex-col gap-4">
      {/* Fields */}
      <div className="flex flex-col gap-3">
        {/* Username */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Username
          </span>
          <div className="flex items-center justify-between bg-white border border-blue-100/60 rounded-lg px-3 py-2 hover:border-[#175ddc]/30 hover:shadow-sm transition-all">
            <span className="text-sm font-semibold text-slate-800 truncate select-all pr-2">
              {password.username}
            </span>
            <button
              onClick={() => handleCopy(password.username, setCopiedUsername)}
              className="p-1.5 text-gray-400 hover:text-[#175ddc] hover:bg-slate-100 rounded transition-all cursor-pointer relative flex-shrink-0"
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Password
            </span>
            <div className="flex items-center justify-between bg-white border border-blue-100/60 rounded-lg px-3 py-2 hover:border-[#175ddc]/30 hover:shadow-sm transition-all">
              <span
                className={`text-sm font-semibold text-slate-800 truncate pr-2 ${!showPassword ? "tracking-widest text-[9px] select-none font-mono" : "font-mono"}`}
              >
                {showPassword ? password.password : "••••••••••••"}
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-gray-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all cursor-pointer"
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
                    handleCopy(password.password || "", setCopiedPassword)
                  }
                  className="p-1.5 text-gray-400 hover:text-[#175ddc] hover:bg-slate-100 rounded transition-all cursor-pointer relative"
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
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 text-slate-500"
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
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-sm">
              {password.note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordsCard;

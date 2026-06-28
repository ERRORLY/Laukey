import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../store.ts";
import { showToast } from "./Toast.tsx";
import {
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

const MasterKeyGate = () => {
  const { setMasterKey, setVerified } = useAppStore();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  useEffect(() => {
    const checkMasterKey = async () => {
      try {
        const exists = await invoke<boolean>("has_master_key");
        setHasKey(exists);
      } catch (err) {
        console.error("Failed to check master key:", err);
        setHasKey(false);
      } finally {
        setChecking(false);
      }
    };
    checkMasterKey();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast.error("Master key cannot be empty");
      return;
    }
    if (password.length < 6) {
      showToast.error("Master key must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    // Yield execution to allow React state commit & DOM repaint
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      await invoke("create_master_key", { masterPassword: password });
      setMasterKey(password);
      setVerified(true);
      showToast.success("Master key created successfully!");
    } catch (err) {
      console.error("Failed to create master key:", err);
      showToast.error(
        typeof err === "string" ? err : "Failed to create master key",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast.error("Please enter your master key");
      return;
    }

    setSubmitting(true);
    // Yield execution to allow React state commit & DOM repaint
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const isCorrect = await invoke<boolean>("verify_master_key", {
        masterPassword: password,
      });
      if (isCorrect) {
        setMasterKey(password);
        setVerified(true);
        showToast.success("Vault unlocked successfully!");
      } else {
        showToast.error("Incorrect master key. Please try again.");
      }
    } catch (err) {
      console.error("Failed to verify master key:", err);
      showToast.error(
        typeof err === "string" ? err : "Failed to verify master key",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetVault = async () => {
    if (resetConfirmText !== "RESET") {
      showToast.error("Please type RESET to confirm");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Call native Rust reset command
      await invoke("reset_vault");

      // 2. Reset app store states
      setMasterKey("");
      setVerified(false);

      // 3. Reset local gate states
      setHasKey(false);
      setPassword("");
      setConfirmPassword("");
      setShowResetConfirm(false);
      setResetConfirmText("");

      showToast.success(
        "Vault reset successfully! You can now create a new master key.",
      );
    } catch (err) {
      console.error("Failed to reset vault:", err);
      showToast.error("Failed to reset vault");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] flex flex-col items-center justify-center p-12 gap-3 text-slate-400 dark:text-slate-500 transition-colors duration-200">
        <Key className="w-10 h-10 text-[#175ddc] animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#0b0f19] flex flex-col items-center justify-center p-4 font-sans text-gray-800 dark:text-slate-300 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 theme-border rounded-2xl p-8 shadow-xl relative flex flex-col items-center gap-6">
        {/* Shield Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-[#175ddc] flex items-center justify-center shadow-md relative">
          {hasKey ? (
            <Lock className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <Unlock className="w-8 h-8 text-white" />
          )}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {hasKey ? "Unlock Your Vault" : "Create Master Key"}
          </h2>
        </div>

        {hasKey ? (
          /* Verify Master Key Form */
          <form
            onSubmit={handleVerifyKey}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Master Key
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter master key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-[#175ddc] hover:from-blue-700 hover:to-[#114ab8] text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 mt-2"
            >
              {submitting ? "Unlocking..." : "Unlock Vault"}
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-semibold text-gray-800 dark:text-gray-400 hover:text-rose-600 hover:underline mt-2 cursor-pointer text-center"
            >
              Forgot Master Key? Reset Vault
            </button>
          </form>
        ) : (
          /* Create Master Key Form */
          <form
            onSubmit={handleCreateKey}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                New Master Key
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Choose a strong key (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Confirm Master Key
              </label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Repeat master key"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#175ddc] dark:focus:border-blue-500 text-gray-900 dark:text-white transition-all"
              />
            </div>

            {/* Warning callout */}
            <div className="bg-amber-50 dark:bg-amber-955/20 dark:bg-rose-900 border border-amber-200/50 dark:border-amber-900/30 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-gray-200 leading-normal">
              <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div className="">
                <span className="font-bold">Important:</span> This master key
                encrypts your database. If lost, your saved passwords cannot be
                recovered.
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer bg-gradient-to-r from-blue-600 to-[#175ddc] hover:from-blue-700 hover:to-[#114ab8] text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 mt-1"
            >
              {submitting ? "Creating..." : "Set Master Key"}
            </button>
          </form>
        )}
      </div>

      {/* Reset Vault Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => {
              if (!submitting) {
                setShowResetConfirm(false);
                setResetConfirmText("");
              }
            }}
          />

          {/* Dialog Card (Centered, compact, beautiful layout) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative z-10 p-6 flex flex-col items-center text-center gap-5 transform scale-100 transition-all duration-200 animate-[in_0.15s_ease-out]">
            {/* Warning Icon */}
            <div className=" flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-10 h-10" />
            </div>

            {/* Title & Warning Text */}
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Reset Vault & Delete Data?
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                This will permanently delete{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  passwords.db
                </span>
                , and all{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  cached logos
                </span>
                . Your data will be gone forever.
              </p>
            </div>

            {/* Input Confirmation */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-center">
                Type "RESET" to confirm
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirmText}
                onChange={(e) =>
                  setResetConfirmText(e.target.value.toUpperCase())
                }
                className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-widest text-gray-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  setResetConfirmText("");
                }}
                disabled={submitting}
                className="flex-1 cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetVault}
                disabled={submitting || resetConfirmText !== "RESET"}
                className="flex-1 cursor-pointer px-4 py-2.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Resetting..." : "Reset Vault"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterKeyGate;

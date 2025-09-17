"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import "../App.css";
import {
  Moon,
  Sun,
  Key,
  Laptop,
  CreditCard,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Copy,
  Edit,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Menu,
  X,
  Check,
  Globe,
  Star,
  Book,
  MessageSquare,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import Papa from "papaparse";
import { ToastContainer, toast } from "react-toastify";
import { open as openShell } from "@tauri-apps/plugin-shell";

// The main App component
const Laukey = () => {
  // --- STATE MANAGEMENT ---
  const [passwords, setPasswords] = useState([]);

  const getDB = async () => {
    try {
      const result = await invoke<string>("get_db");
      console.log("DB content:", result);

      // Parse the result and ensure it's an array
      let parsed;
      try {
        parsed = JSON.parse(result);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        parsed = [];
      }

      // Ensure parsed is an array - if it's an empty object {}, convert to empty array
      if (!Array.isArray(parsed)) {
        console.log("DB returned non-array, initializing with empty array");
        parsed = [];
      }

      setPasswords(parsed);
    } catch (e) {
      console.error("Error reading DB:", e);
      // Set empty array as fallback
      setPasswords([]);
    }
  };

  useEffect(() => {
    getDB();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordToDeleteId, setPasswordToDeleteId] = useState(null);
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [showPassword, setShowPassword] = useState({});
  const [activeCategory, setActiveCategory] = useState("All");

  // Form state for adding/editing
  const [formState, setFormState] = useState({
    website: "",
    username: "",
    password: "",
    category: "General",
    notes: "",
    favorite: false,
  });

  // Ref for the copy message to handle its display time
  const copyMessageRef = useRef(null);

  // --- THEME LOGIC ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // --- PASSWORD LOGIC ---
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();

    if (editingPassword) {
      const updated = passwords.map((pw) =>
        pw.id === editingPassword.id ? { ...pw, ...formState } : pw
      );
      setPasswords(updated);
      saveToDB(updated); // ✅ save updated list
      setEditingPassword(null);
      notify("Password Updated Successfully");
    } else {
      const newPassword = {
        ...formState,
        id:
          passwords.length > 0
            ? Math.max(...passwords.map((p) => p.id)) + 1
            : 1,
      };
      const updated = [...passwords, newPassword];
      setPasswords(updated);
      saveToDB(updated);
      notify("Password Added Successfully");
    }

    setShowAddForm(false);
    resetForm();
  };

  const saveToDB = (password) => {
    invoke("save_pass", { passwords: JSON.stringify(password) })
      .then(() => console.log("Password saved successfully!"))
      .catch((e) => console.error("Error saving password:", e));
  };

  const handleEditClick = (pw) => {
    setEditingPassword(pw);
    setFormState(pw);
    setShowAddForm(true);
  };

  const handleDeleteClick = (id) => {
    console.log("clicked");
    setShowDeleteModal(true);
    setPasswordToDeleteId(id);
  };

  const confirmDelete = () => {
    const updated = passwords.filter((pw) => pw.id !== passwordToDeleteId);

    setPasswords(updated);
    setShowDeleteModal(false);
    setPasswordToDeleteId(null);

    saveToDB(updated); // ✅ persist the updated array
    notify("Password has been deleted");
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPasswordToDeleteId(null);
    saveToDB(passwords);
  };

  const resetForm = () => {
    setFormState({
      website: "",
      username: "",
      password: "",
      category: "General",
      notes: "",
      favorite: false,
    });
  };

  const handleCopyPassword = (text) => {
    // Copy to clipboard using a fallback method for better iframe support
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);

    notify("Password Copied To ClipBoard");
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setIsSidebarOpen(false); // Close sidebar on selection
  };

  // --- FILTERING AND SEARCHING ---
  const filteredPasswords = useMemo(() => {
    return passwords
      .filter((pw) => {
        const matchesCategory =
          activeCategory === "All" ||
          pw.category === activeCategory ||
          (activeCategory === "Favorites" && pw.favorite);
        const matchesSearch =
          pw.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pw.username.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => b.id - a.id); // Sort by most recent first
  }, [passwords, searchTerm, activeCategory]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Social":
        return <MessageSquare size={16} />;
      case "Work":
        return <Laptop size={16} />;
      case "Entertainment":
        return <Star size={16} />;
      case "Shopping":
        return <CreditCard size={16} />;
      case "Learning":
        return <Book size={16} />;
      default:
        return <Globe size={16} />;
    }
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
      });

      if (selected) {
        // Get only new records from CSV (backend already filters duplicates)
        const newRecords = await invoke("read_csv_file", {
          filePath: selected,
        });
        
        if (newRecords.length === 0) {
          notify("No new passwords to import (duplicates skipped)");
          return;
        }
        
        // Merge with existing passwords
        const updated = [...passwords, ...newRecords];
        setPasswords(updated);
        saveToDB(updated); // Save the complete merged list
        notify(`${newRecords.length} passwords imported successfully`);
      } else {
        console.log("File selection cancelled.");
      }
    } catch (error) {
      console.error("Error selecting or reading file:", error);
      notify("Error importing passwords");
    }
  };

  const handleExport = async () => {
    try {
      const data = passwords.map(({ website, username, password, notes }) => ({
        name: website,
        url: `https://${website}`,
        username,
        password,
        note: notes, // i am afraid to break anything here
      }));

      // generate CSV without headers
      let csv = Papa.unparse(data, {
        header: false,
        quotes: true, // force all values quoted
      });

      // prepend headers manually (unquoted)
      const headers = "name,url,username,password,note";
      csv = headers + "\n" + csv;
      // 2. Ask user for save path
      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: "laukey_passwords.csv",
      });

      if (!filePath) {
        console.log("Export canceled");
        return;
      }

      // 3. Write CSV to disk
      await writeTextFile(filePath, csv);
      notify("File Saved successfully");
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export: " + error);
    }
  };

  const notify = (e) => toast(e, { theme: "dark" });

  const [isOpen, setIsOpen] = useState(false);

  const categoryList = [
    "All",
    "Favorites",
    ...new Set(passwords.map((p) => p.category)),
  ];

  const [update, setUpdate] = useState("")
  const checkUpdate = async () => {
    try {
      const res = await fetch("https://errorly.github.io/Laukey/updated.json");

      if (res.status == 200) {
        setUpdate("Available")
      } else if (res.status == 404) {
        setUpdate("Not Available")
      }
    } catch (err) {
      setUpdate("Not Available")
    }
  }

  return (
    <>
      <ToastContainer />
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl shadow-2xl bg-white text-gray-900 dark:bg-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="cursor-pointer absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold mb-6 border-b pb-2 border-gray-200 dark:border-gray-700">
              App Settings
            </h2>

            {/* Data Management Section */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300">
                Data Management
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Import or export your settings data. Check out our <button onClick={() => openShell("https://errorly.github.io/Laukey")} className="text-blue-500 cursor-pointer">Docs</button> for how to import.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleImport}
                  className="flex-1 py-2 px-3 rounded-lg border border-gray-300 bg-white dark:text-gray-300 text-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:text-gray-300 dark:hover:text-gray-200 hover:shadow-sm text-sm font-medium cursor-pointer transition dark:hover:bg-gray-700"
                >
                  Import
                </button>

                <button
                  onClick={handleExport}
                  className="flex-1 py-2 px-3 rounded-lg border border-transparent bg-sky-600 text-white text-sm font-medium hover:opacity-90 cursor-pointer transition"
                >
                  Export
                </button>
              </div>
              
            </div>
            <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300">
                  Some Notes
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  This Application is currently in beta, for future updates or bug related issue, Join <button onClick={() => openShell("https://errorly.github.io/")} className="text-blue-500 cursor-pointer">Errorly</button> Community.
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">

                </p>

            </div>
            <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-300">
                  Check For Updates
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  check for updates, These will be automatic from next version.

                </p>
                <button
                  onClick={checkUpdate}
                  className="flex-1 py-2 px-3 rounded-lg border border-transparent bg-sky-600 text-white text-sm font-medium hover:opacity-90 cursor-pointer transition"
                >
                  Check Updates
                </button>
                {update === "Available" && (
                  <h4 className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    <span className="text-green-400 dark:text-green-400">
                      Update is Available<span className="text-xs text-gray-600 dark:text-gray-400">, Visit <button onClick={() => openShell("https://errorly.github.io/Laukey")} className="text-blue-500 cursor-pointer">Laukey</button> Page To Download It</span>
                    </span>
                  </h4>
                )}

                {update === "Not Available" && (
                  <h4 className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                    <span className="text-red-400 dark:text-red-400">
                      No Update Available.
                    </span>
                  </h4>
                )}
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen transition-colors duration-300 dark:bg-gray-900 dark:text-gray-200">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-56 p-4 transition-transform duration-300 shadow-lg dark:bg-gray-800 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0 md:flex-shrink-0 md:rounded-r-xl`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-5 mx-5 mt-3">
              <h2 className="text-2xl font-bold">Laukey</h2>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-full md:hidden dark:hover:bg-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="space-y-2">
            {categoryList.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`cursor-pointer flex items-center w-full px-4 py-2 space-x-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeCategory === category
                    ? "bg-blue-500 text-white shadow-md"
                    : "dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {category === "All" && <Key size={16} />}
                {category === "Favorites" && <Star size={16} />}
                {category !== "All" &&
                  category !== "Favorites" &&
                  getCategoryIcon(category)}
                <span>{category}</span>
              </button>
            ))}
          </nav>
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <button
              onClick={() => setIsOpen(true)}
              className="cursor-pointer flex items-center justify-center w-full p-3 transition-colors duration-200 rounded-xl border hover:text-white dark:border-blue-500 dark:bg-gray-950 hover:border-transparent hover:bg-blue-600"
            >
              Settings
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Mobile menu and header */}
          <header className="flex items-center justify-between md:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full dark:hover:bg-gray-800"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold">Passwords</h1>
            <div className="w-8"></div>
          </header>

          <div className="hidden md:flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Passwords</h1>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingPassword(null);
                resetForm();
              }}
              className="flex items-center px-6 py-3 space-x-2 font-medium text-white hover:bg-blue-600 bg-blue-500 rounded-lg shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <Plus size={20} />
              <span>Add New Password</span>
            </button>
          </div>

          {/* Add/Edit Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-xl p-6 sm:p-8 rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transform transition-all duration-300 scale-95 md:scale-100 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {editingPassword ? "Edit Password" : "Add New Password"}
                  </h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X size={22} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddOrUpdate} className="space-y-5">
                  {/* Website */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formState.website}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formState.username}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.form ? "text" : "password"}
                        name="password"
                        value={formState.password}
                        onChange={handleFormChange}
                        required
                        className="w-full pr-12 px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => ({
                            ...prev,
                            form: !prev.form,
                          }))
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword.form ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formState.category}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                    >
                      <option value="General">General</option>
                      <option value="Social">Social</option>
                      <option value="Work">Work</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Learning">Learning</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formState.notes}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    ></textarea>
                  </div>

                  {/* Favorite */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="favorite"
                      checked={formState.favorite}
                      onChange={handleFormChange}
                      className="w-5 h-5 text-blue-600 bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Favorite
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 font-medium text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cursor-pointer px-6 py-2.5 font-medium text-white rounded-full bg-blue-600 hover:bg-blue-700 transition"
                    >
                      {editingPassword ? "Save Changes" : "Add Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search bar and add button */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by website or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3 pl-10 pr-4 transition-colors duration-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingPassword(null);
                resetForm();
              }}
              className="flex items-center justify-center w-full px-6 py-3 space-x-2 font-medium text-white transition-transform duration-200 bg-blue-500 rounded-full shadow-lg md:w-auto hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 md:hidden"
            >
              <Plus size={20} />
              <span>Add New</span>
            </button>
          </div>

          {/* Password list grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPasswords.length > 0 ? (
              filteredPasswords.map((pw) => (
                <div
                  key={pw.id}
                  className="p-6 transition-all duration-300 transform rounded-2xl shadow-lg dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 truncate">
                      <span className="p-2 text-blue-500 bg-blue-100 rounded-full dark:bg-blue-900/50">
                        {getCategoryIcon(pw.category)}
                      </span>
                      <h3 className="text-lg font-semibold">{pw.website}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      {pw.favorite && (
                        <Star
                          size={16}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="w-24 dark:text-gray-400">Username:</span>
                      <span className="flex-1 font-medium truncate">
                        {pw.username}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 dark:text-gray-400">Password:</span>
                      <div className="relative flex-1 font-mono truncate">
                        <span className="block truncate">
                          {showPassword[pw.id]
                            ? pw.password
                            : "••••••••••••••••"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 space-x-2">
                    <button
                      onClick={() => handleCopyPassword(pw.password)}
                      className="p-2 transition-colors duration-200 rounded-full text-blue-500 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => togglePasswordVisibility(pw.id)}
                      className="p-2 transition-colors duration-200 rounded-full text-blue-500 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                    >
                      {showPassword[pw.id] ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditClick(pw)}
                      className="p-2 transition-colors duration-200 rounded-full text-blue-500 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pw.id)}
                      className="p-2 transition-colors duration-200 rounded-full text-red-500 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-1 p-6 text-center rounded-lg md:col-span-full">
                No passwords found.
              </div>
            )}
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
                <div className="w-full max-w-sm p-6 space-y-4 rounded-xl shadow-lg bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Confirm Deletion</h3>
                    <button
                      onClick={cancelDelete}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete this password? This action
                    cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 rounded-full dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-red-500 rounded-full hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Copy Message */}
            {showCopyMessage && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-full shadow-lg transition-transform duration-300 animate-in fade-in slide-in-from-bottom-2">
                <Check size={16} className="inline-block mr-2" />
                Copied to clipboard!
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Laukey;
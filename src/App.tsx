import Homepage from "./pages/Homepage.tsx";
import Passwords from "./pages/Passwords.tsx";
import AddPasswords from "./components/AddPasswords.tsx";
import { Toaster } from "react-hot-toast";

import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <HashRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "var(--toast-bg)",
            color: "var(--toast-color)",
            border: "1px solid var(--toast-border)",
            borderLeft: "4px solid var(--toast-theme-blue)",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "600",
            padding: "8px 12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/name/:name" element={<Passwords />} />
        <Route path="/add" element={<AddPasswords />} />
      </Routes>
    </HashRouter>
  );
};

export default App;

// todo: create router base

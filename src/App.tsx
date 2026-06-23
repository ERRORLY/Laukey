import Homepage from "./pages/Homepage.tsx";
import Passwords from "./pages/Passwords.tsx";
import AddPasswords from "./components/AddPasswords.tsx";

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

import Homepage from "./pages/Homepage.tsx";
import Passwords from "./pages/Passwords.tsx";
import AddPasswords from "./components/AddPasswords.tsx";

import "./App.css";
import { HashRouter, Routes, Route } from "react-router-dom";

const App = () => {
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

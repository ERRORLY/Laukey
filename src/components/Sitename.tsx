import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import getSiteName from "../utils/getSiteName.ts";
import Passwords from "./Passwords.tsx";
// import test from "../utils/test.ts";

const SiteName = () => {
  const [siteName, setSiteName] = useState([]);

  useEffect(() => {
    const fetchSiteName = async () => {
      let data = await getSiteName();
      setSiteName(data);
    };
    fetchSiteName();
  }, []);
  return (
    <>
      <div className="flex gap-4 items-center justify-center">
        {siteName.map((name, key) => (
          <button
            className="cursor-pointer"
            onClick={() => Passwords({ siteName: name })}
          >
            {name}
          </button>
        ))}
      </div>
    </>
  );
};

export default SiteName;

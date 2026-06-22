import { invoke } from "@tauri-apps/api/core";

export default async function test() {
  let names = ["Google", "Instagram", "Steam", "Discord", "Reddit"];
  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < 10; j++) {
      await invoke("add_passwords", {
        masterKey: "Hello",
        name: names[i],
        url: `https://${names[i].toLowerCase()}.com/`,
        username: `Guy${j}`,
        password: `Password{j}`,
        note: "",
      });
    }
  }
}

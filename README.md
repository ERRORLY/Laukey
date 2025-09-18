<div align="center">
    <img src="images/laukey_logo.png" alt="Laukey logo" width="256" height="256" />
</div>

> Laukey is in Beta, So You May encounter some bugs.

Ever Needed a Password manager to manage all your password in one place? Obviously You Have And Thats Why We are happy to present you Laukey - An Password Manager with lot of features With A Modern UI

## ScreenShots
<img src="images/ss.png" alt="Screenshot 1" style="max-width:100%; margin-bottom:20px; border-radius:12px;" />

## ✨ Features

- No Authentication or Login Required
- Clean And Modern UI
- Dark And Light Mode Supports
- Passwords Encrypted And Saved Locally
- Import And Export in CSV
- Add/Edit Options
- Different Categories
- Responsive For Any Layout
- Open Source

## 📥 Downloads

> Note for Windows users: You may receive a security warning when downloading. This is expected, as the software isn’t code-signed due to the [high cost of a certificate](https://www.digicert.com/signing/compare-code-signing-certificates). Click "More info" > "Run anyway" to proceed safely.


<div style="display:flex; justify-content:center; gap:40px; margin-top:20px;"> 
  <details open style="min-width:200px; text-align:center;">
    <summary>🪟 Windows</summary>
    <br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/laukey_0.1.0_x64-setup.exe">Installer (nsis) (Recommended)</a><br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/laukey_0.1.0_x64_en-US.msi">Installer (.msi)</a><br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/Laukey.exe">.exe</a>
  </details>
    <!-- Linux Dropdown -->
  <details open style="min-width:200px; text-align:center;">
    <summary>🐧 Linux</summary>
    <br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/laukey_0.1.0_amd64.deb">.deb (Ubuntu)</a><br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/laukey-0.1.0-1.x86_64.rpm">.rpm (OpenSuse And Others)</a><br/>
    <a href="https://github.com/ERRORLY/Laukey/releases/download/Beta/laukey_0.1.0_amd64.AppImage">.AppImage</a>
  </details>
</div>

<br/>
<details>
  <summary>📦 Installer Info (Click to Expand)</summary>
  <br/>
  <strong>🪟 Windows:</strong><br/>
  - <code>laukey_0.1.0_x64-setup.exe</code> – Standard installer with setup wizard (Recommended)<br/>
  - <code>laukey_0.1.0_x64_en-US.msi</code> – MSI installer for IT admins or deployment tools<br/>
  - <code>Laukey.exe</code> – Portable version, no installation needed<br/><br/>
  <strong>🐧 Linux:</strong><br/>
  - <code>laukey_0.1.0_amd64.deb</code> – For Debian/Ubuntu systems (install via <code>dpkg</code>)<br/>
  - <code>laukey-0.1.0-1.x86_64.rpm</code> – For Fedora/RHEL/openSUSE systems (install via <code>rpm</code>)<br/>
  - <code>laukey_0.1.0_amd64.AppImage</code> – Portable, runs on most distros without install<br/>
</details>
<br/>

## Build Or Run Through Code
- You can also run or Build the application.

### How to build from source
```
git clone https://github.com/ERRORLY/Laukey.git
cd Laukey
npm i 
npm run tauri build
```

After this your application will be ready in src-tauri/target/release/bundle, the file there will be of either .msi, setup.exe, .exe or .appimage, .deb, .rpm depending on your OS

### How to Run Through Code
```
git clone https://github.com/ERRORLY/Laukey.git
cd Laukey
npm i 
npm run tauri dev
```

## 📚 Docs

**1**. If your issue isn’t here, join our [**Discord**](https://discord.gg/JwfsagYANM) for quick support.

**2**. Import/Export works only with `.csv` files. The file must follow this format for importing:
```csv
name,url,username,password,note
"My Site","https://example.com","user123","mypassword"
```
This is the standard file which you get after exporting your file from chrome browser

**3**. Dark And Light Mode Will Be Automatically Set As Per your System Theme, changing manually will come in future version.

**4**. If you want to know more on how the code works, check out our [documentation.md](https://github.com/ERRORLY/Laukey/blob/main/documentation.md)

## 📝 Future Versions TODO (for v0.2 to v0.3)
```
- [ ] Let users add categories  
- [ ] Let users pick theme colors  
- [ ] fix notes to note issue
- [ ] Add app lock with password  
- [ ] Add dark and light mode toggle  
- [ ] Use standalone plugin for saving secrets instead of keyring
```

## 📫 Supports
To Report Bugs or Request Features Join Our [Discord](https://discord.gg/JwfsagYANM) or [Mail](mailto:errorlydev@gmail.com) us
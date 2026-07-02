<div align="center">
  <img src="/images/laukey-logo.png" alt="Laukey Logo" width="150">
  <h1>Laukey</h1>
  <div>
    <img src="https://img.shields.io/badge/Version-0.2-blue?style=flat">
    <img src="https://img.shields.io/badge/License-GPL-green?style=flat" alt="Badge">
    <a href="https://discord.gg/JwfsagYANM" target="_blank">
      <img src="https://img.shields.io/badge/Chat-Discord-0069c2?style=flat&logo=discord&logoColor=white" alt="Badge">
    </a>
  </div>
</div>
<br>
    
Laukey is a **local-first** password manager. All passwords are encrypted and stored locally. It supports **importing passwords** from other services, such as web browsers, and exporting them is also available. Additionally, it offers **dark mode support** for users who prefer that style.

## ✨ Screenshots

![](/images/screenshot/1.png)

<details>
<summary>View more screenshots</summary>

<br>

![](/images/screenshot/3.png)

<hr>

![](/images/screenshot/2.png)


</details>

## ✨ Installation

Laukey is available for **Windows**, **Linux**, and can also be built **from source**. If your operating system isn't listed below, you can compile it yourself by following the **From Source** instructions.

For additional installation methods (such as **`.deb`**, **`.rpm`**, and other packages), visit the [Releases](https://github.com/ERRORLY/Laukey/releases/tag/v0.2) page.

---

<details>
<summary><strong>🪟 Windows</strong></summary>

### Installer

Download the latest Windows installer:

**[Laukey Setup (.msi)](https://github.com/ERRORLY/Laukey/releases/download/v0.2/Laukey_0.2.0_x64_en-US.msi)**

Need a different package? Check the [Releases](https://github.com/ERRORLY/Laukey/releases/tag/v0.2) page for all available installation options.

</details>

---

<details>
<summary><strong>🐧 Linux</strong></summary>

For most users, the easiest way to install Laukey is by running the following command in your terminal. It will automatically download and set up the **AppImage** version.

```bash
curl -fsSL https://raw.githubusercontent.com/ERRORLY/Laukey/refs/heads/main/scripts/linux-install.sh | bash
```

If you prefer a different installation method (such as **`.deb`** or **`.rpm`** packages), you'll find them on the [Releases](https://github.com/ERRORLY/Laukey/releases/tag/v0.2) page.

</details>

---

<details>
<summary><strong>🛠️ Build from Source</strong></summary>

If you'd like to compile Laukey yourself or customize the source code, run the following commands:

```bash
git clone https://github.com/ERRORLY/Laukey.git
cd Laukey
npm install
npm run tauri build
```

Once the build is complete, you'll find the generated executables in:

```text
src-tauri/target/bundle/release
```

</details>


## ✨ FAQs/Usage
checkout the [website](https://errorly.github.io/Laukey) for faqs

## ✨ Contributing
Contributions, bug reports, and feature requests are welcome. Feel free to open an issue or submit a pull request.

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { writeFile, mkdir, BaseDirectory, exists } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { downloadDir, join } from "@tauri-apps/api/path";

const loadLogo = async () => {
  // 1. Get the path to where the file was saved
  const downloadPath = await downloadDir();
  const filePath = await join(downloadPath, "my-logo.png");

  // 2. Convert the system path to an asset URL
  // This turns it into something like: asset://localhost/.../my-logo.png
  const assetUrl = convertFileSrc(filePath);

  // 3. Set this URL to your image element's src
  const imgElement = document.getElementById("logo") as HTMLImageElement;
  imgElement.src = assetUrl;
};

const getLogo = async (name: string, url: string) => {
  if (!url) return;
  if (!name) return;

  const fileName = `${name}.png`;
  const fileExists = await exists(`logo/${fileName}`, {
    baseDir: BaseDirectory.AppData,
  });

  if (fileExists) {
    return;
  }

  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const encodedUrl = encodeURIComponent(cleanUrl);
  const logoUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodedUrl}&size=256`;
  console.log(`Downloading logo: ${logoUrl}`);
  await downloadImage(logoUrl, fileName);
};

async function downloadImage(
  imageUrl: string,
  fileName: string = "download.png",
): Promise<void> {
  try {
    // 1. Fetch the image
    const response = await tauriFetch(imageUrl, { method: "GET" });
    if (!response.ok) console.log("image not found");

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. Create the "logo" folder inside AppData if it doesn't exist
    // setting recursive: true prevents crashing if it already exists
    await mkdir("logo", {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });

    // 3. Save the file inside the newly created "logo" folder
    const filePath = `logo/${fileName}`;
    await writeFile(filePath, uint8Array, {
      baseDir: BaseDirectory.AppData,
    });

    console.log(`Successfully saved ${fileName} to AppData/logo/!`);
  } catch (error) {
    console.error("Tauri download/write failed:", error);
  }
}

function _extractSiteName(urlText: string): string {
  let cleaned = urlText.trim();
  if (!cleaned) return "";

  // Prepend protocol if missing so URL parser works
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }

  try {
    const url = new URL(cleaned);
    let hostname = url.hostname.toLowerCase();

    // Remove port if any
    hostname = hostname.split(":")[0];

    // Split by '.'
    const parts = hostname.split(".");
    if (parts.length < 2) {
      return "";
    }

    // Common second-level domains/suffixes (like co.uk, com.au, etc.)
    const commonSuffixes = new Set([
      "co",
      "com",
      "org",
      "net",
      "gov",
      "edu",
      "ac",
      "mil",
    ]);

    let parentIndex = parts.length - 2;

    if (parts.length >= 3) {
      const secondLast = parts[parts.length - 2];
      if (commonSuffixes.has(secondLast)) {
        // e.g. domain.co.uk or sub.domain.co.uk
        parentIndex = parts.length - 3;
      } else {
        // e.g. sub.domain.com
        parentIndex = parts.length - 2;
      }
    }

    if (parentIndex >= 0) {
      const parentDomain = parts[parentIndex];
      return parentDomain.charAt(0).toUpperCase() + parentDomain.slice(1);
    }
  } catch (e) {
    // Fallback if URL parsing fails
    const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s\.:]+)/i);
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1);
    }
  }
  return "";
}

export { getLogo, loadLogo };
export default getLogo;

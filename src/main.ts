import { arrayBufferToWebP } from "webp-converter-browser";
const inputFileElement = document.getElementById("uploadInput") as HTMLInputElement;
const outputImageElement = document.getElementById("outputImage") as HTMLImageElement;
const btn = document.querySelector(".buton-download") as HTMLAnchorElement;
init();
function init() {
  if (!inputFileElement) return;
  if (!outputImageElement) return;
  inputFileElement.addEventListener("change", handleUpload);
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target || !target.files || target.files.length === 0) {
    return;
  }

  const file = target.files[0];
  if (file) {
    try {
      const webpBlob = await convertToWebP(file);
      const webpUrl = URL.createObjectURL(webpBlob);
      if (!btn) {
        return;
      }
      btn.href = webpUrl;
      btn.classList.remove("d-none");

      outputImageElement.src = webpUrl;
    } catch (error) {
      console.error("Error converting to WebP:", error);
    }
  }
}

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Read the file as a binary data
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    // When the file is loaded, convert it to WebP format using webp-converter
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      try {
        const webpData = await arrayBufferToWebP(buffer);

        const webpBlob = new Blob([webpData], { type: "image/webp" });
        resolve(webpBlob);
      } catch (error) {
        reject(error);
      }
    };

    // Handle error if file reading fails
    reader.onerror = (event) => {
      reject(event);
    };
  });
}

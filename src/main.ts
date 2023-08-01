// JavaScript
import { arrayBufferToWebP } from "webp-converter-browser";
import JSZip from "jszip";

const inputFileElement = document.getElementById("uploadInput") as HTMLInputElement;
const imagesContainer = document.querySelector(".images-container") as HTMLElement;
const btn = document.querySelector(".buton-download") as HTMLAnchorElement;
const maxWidth = 1200; // Maximum width for resized images
init();

function init() {
  if (!inputFileElement) return;

  inputFileElement.addEventListener("change", handleUpload);
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target || !target.files || target.files.length === 0) {
    return;
  }

  try {
    const webpBlobs = await Promise.all(Array.from(target.files).map((file) => convertToWebP(file)));

    if (imagesContainer) {
      // Clear the imagesContainer before appending new images
      imagesContainer.innerHTML = "";

      // Loop through all the converted WebP images and append them to the imagesContainer
      webpBlobs.forEach((webpBlob) => {
        const webpUrl = URL.createObjectURL(webpBlob);
        const outputImageElement = document.createElement("img") as HTMLImageElement;
        outputImageElement.src = webpUrl;
        imagesContainer.appendChild(outputImageElement);
      });
    }

    if (!btn) {
      return;
    }
    if (btn) {
      if (!target.files) return;
      btn.addEventListener("click", () => handleDownload(target.files));
      btn.classList.add("d-none"); // Hide the download button initially
    }
    btn.classList.remove("d-none"); // Show the download button when images are ready
  } catch (error) {
    console.error("Error converting to WebP:", error);
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
        const resizedBuffer = await resizeImage(buffer);
        const webpData = await arrayBufferToWebP(resizedBuffer);

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

async function resizeImage(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate the new dimensions while maintaining the aspect ratio
      let newWidth = img.width;
      let newHeight = img.height;
      if (img.width > maxWidth) {
        const aspectRatio = img.width / img.height;
        newWidth = maxWidth;
        newHeight = newWidth / aspectRatio;
      }

      // Set the canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      if (!ctx) return;
      // Draw the image on the canvas with the new dimensions
      ctx.rect(0, 0, newWidth, newHeight);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Get the resized image as a data URL and convert it back to an ArrayBuffer
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          if (!reader) return;
          if (!blob) return;
          reader.readAsArrayBuffer(blob);
          reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
          };
        },
        "image/jpeg",
        0.9
      ); // Convert to JPEG format with 90% quality (you can adjust the quality as needed)
    };

    // Load the image to get its dimensions
    const blob = new Blob([buffer]);
    img.src = URL.createObjectURL(blob);
  });
}

async function handleDownload(files: FileList | null) {
  const webpBlobs = await Promise.all(
    Array.from(imagesContainer.querySelectorAll("img")).map((imgElement) =>
      fetch(imgElement.src).then((response) => response.blob())
    )
  );
  if (!files) return;
  const fnames = Array.from(files).map((imgElement) => {
    const fname = imgElement.name.replace(/\.[^/.]+$/, "");
    return fname;
  });

  const zip = new JSZip();
  webpBlobs.forEach((webpBlob, index) => {
    zip.file(`${fnames[index]}.webp`, webpBlob);
  });

  zip.generateAsync({ type: "blob" }).then((content) => {
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "webp_images.zip";
    a.click();
    URL.revokeObjectURL(downloadUrl);
  });
}

import { ImageQuality } from "../types";

const MAX_ANALYSIS_SIZE = 320;

export async function analyzeImageQuality(file: File): Promise<ImageQuality> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_ANALYSIS_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    return fallbackQuality();
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  const gray = new Float32Array(width * height);
  let brightnessSum = 0;

  for (let i = 0, pixel = 0; i < data.length; i += 4, pixel += 1) {
    const value = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[pixel] = value;
    brightnessSum += value;
  }

  const brightness = brightnessSum / gray.length;
  const sharpness = edgeSharpness(gray, width, height);
  const tips: string[] = [];

  if (sharpness < 8) tips.push("Hold the phone steady and retake the leaf photo.");
  if (brightness < 55) tips.push("Move near brighter natural light.");
  if (brightness > 220) tips.push("Avoid direct glare or white background reflections.");

  if (sharpness < 5) {
    return {
      status: "bad",
      sharpness,
      brightness,
      message: "This photo looks very blurry. Retaking it will give a cleaner diagnosis.",
      tips,
    };
  }

  if (sharpness < 8 || brightness < 55 || brightness > 220) {
    return {
      status: "warning",
      sharpness,
      brightness,
      message: "Photo quality can be improved before scanning.",
      tips,
    };
  }

  return {
    status: "good",
    sharpness,
    brightness,
    message: "Photo looks clear enough for diagnosis.",
    tips: ["Keep the leaf centered and use the original image without filters."],
  };
}

function edgeSharpness(gray: Float32Array, width: number, height: number) {
  if (width < 3 || height < 3) return 0;
  let sum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const gx = gray[index + 1] - gray[index - 1];
      const gy = gray[index + width] - gray[index - width];
      sum += Math.sqrt(gx * gx + gy * gy);
      count += 1;
    }
  }

  return count ? sum / count : 0;
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be read"));
    image.src = URL.createObjectURL(file);
  });
}

function fallbackQuality(): ImageQuality {
  return {
    status: "warning",
    sharpness: 0,
    brightness: 0,
    message: "Photo quality could not be checked on this device.",
    tips: ["Use a clear, centered leaf photo in natural light."],
  };
}

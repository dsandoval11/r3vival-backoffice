type ImageFormat = "jpeg" | "webp" | "png";

const FORMAT_MAP: Record<string, ImageFormat> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/webp": "webp",
  "image/png": "png",
};

const MIME_MAP: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
};

const EXT_MAP: Record<ImageFormat, string> = {
  jpeg: "jpg",
  webp: "webp",
  png: "png",
};

const QUALITY: Record<ImageFormat, number | undefined> = {
  jpeg: 0.6,
  webp: 0.55,
  png: undefined,
};

const MAX_HEIGHT = 1400;

function detectFormat(file: File): ImageFormat | "heic" | null {
  const mime = file.type.toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return "heic";
  if (FORMAT_MAP[mime]) return FORMAT_MAP[mime];

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "heic" || ext === "heif") return "heic";
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "webp") return "webp";
  if (ext === "png") return "png";

  return null;
}

async function convertHeic(file: File): Promise<File> {
  const { heicTo } = await import("heic-to");
  const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.6 });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function makeCanvas(w: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  return el;
}

async function toBlob(
  canvas: OffscreenCanvas | HTMLCanvasElement,
  mime: string,
  quality: number | undefined,
): Promise<Blob> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: mime, quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob returned null"))),
      mime,
      quality,
    );
  });
}

async function resizeAndEncode(file: File, format: ImageFormat): Promise<File> {
  const bitmap = await createImageBitmap(file);
  let { width: w, height: h } = bitmap;

  if (h > MAX_HEIGHT) {
    w = Math.round(w * (MAX_HEIGHT / h));
    h = MAX_HEIGHT;
  }

  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Could not get 2D context");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const mime = MIME_MAP[format];
  const quality = QUALITY[format];
  const blob = await toBlob(canvas, mime, quality);

  if (format === "png" && blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = EXT_MAP[format];
  const outName = `${baseName}.${ext}`;

  console.info(
    `[image-compress] ${file.name} → ${outName} | ${(file.size / 1024).toFixed(1)} KB → ${(blob.size / 1024).toFixed(1)} KB (${Math.round((1 - blob.size / file.size) * 100)}% saved)`,
  );

  return new File([blob], outName, { type: mime, lastModified: Date.now() });
}

export async function processImageForUpload(file: File): Promise<File> {
  const format = detectFormat(file);

  if (format === null) {
    return file;
  }

  if (format === "heic") {
    const jpeg = await convertHeic(file);
    return resizeAndEncode(jpeg, "jpeg");
  }

  return resizeAndEncode(file, format);
}

// components/cropImageUtil.js

const MAX_OUTPUT_DIMENSION = 1400; // Cap dimension to prevent mobile browser canvas memory exhaustion

const GetCroppedImg = (imageSrc, pixelCrop) => {
  const image = new Image();
  // Only set crossOrigin on external URLs; blob: and data: URLs reject crossOrigin on iOS WebKit
  if (!imageSrc.startsWith("blob:") && !imageSrc.startsWith("data:")) {
    image.setAttribute("crossOrigin", "anonymous");
  }
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const naturalWidth = image.naturalWidth || 800;
      const naturalHeight = image.naturalHeight || 1000;

      // Safe fallbacks if pixelCrop is missing or zero
      const cropX = Math.max(0, (pixelCrop && typeof pixelCrop.x === 'number') ? pixelCrop.x : 0);
      const cropY = Math.max(0, (pixelCrop && typeof pixelCrop.y === 'number') ? pixelCrop.y : 0);
      const cropW = Math.min(naturalWidth, (pixelCrop && pixelCrop.width > 0) ? pixelCrop.width : naturalWidth);
      const cropH = Math.min(naturalHeight, (pixelCrop && pixelCrop.height > 0) ? pixelCrop.height : naturalHeight);

      // Scale down cropped dimensions if they exceed MAX_OUTPUT_DIMENSION for mobile safety
      let outWidth = cropW;
      let outHeight = cropH;

      if (outWidth > MAX_OUTPUT_DIMENSION || outHeight > MAX_OUTPUT_DIMENSION) {
        if (outWidth >= outHeight) {
          outHeight = Math.round((outHeight * MAX_OUTPUT_DIMENSION) / outWidth);
          outWidth = MAX_OUTPUT_DIMENSION;
        } else {
          outWidth = Math.round((outWidth * MAX_OUTPUT_DIMENSION) / outHeight);
          outHeight = MAX_OUTPUT_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, outWidth);
      canvas.height = Math.max(1, outHeight);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas 2d context"));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingQuality = "high";
      ctx.imageSmoothingEnabled = true;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        outWidth,
        outHeight
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.85);
    };
    image.onerror = (err) => reject(new Error("Failed to load image for cropping"));
  });
};

export default GetCroppedImg;

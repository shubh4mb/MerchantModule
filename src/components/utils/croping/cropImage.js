// components/cropImageUtil.js

const MAX_OUTPUT_DIMENSION = 1400; // Cap dimension to prevent mobile browser canvas memory exhaustion

const GetCroppedImg = (imageSrc, pixelCrop) => {
  const image = new Image();
  image.setAttribute("crossOrigin", "anonymous");
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      // Scale down cropped dimensions if they exceed MAX_OUTPUT_DIMENSION for mobile safety
      let outWidth = pixelCrop.width;
      let outHeight = pixelCrop.height;

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
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
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

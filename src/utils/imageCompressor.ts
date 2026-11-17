/**
 * Utility to optimize and compress images on the client side before uploading.
 * Critical for mobile browser environments where phone camera images are 15MB - 35MB.
 */

export async function compressImageForUpload(
  file: File | Blob,
  maxDimension: number = 1400,
  quality: number = 0.85
): Promise<File> {
  // If not an image or if in node/SSR, return as-is
  if (typeof window === 'undefined') {
    return file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      // Fallback: return original file wrapped in File if read fails
      resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' }));
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' }));
      };

      img.onload = () => {
        let { width, height } = img;

        // Downscale while maintaining aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' }));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file instanceof File ? file : new File([file], 'image.jpg', { type: 'image/jpeg' }));
              return;
            }
            const originalName = (file as File).name
              ? (file as File).name.replace(/\.[^/.]+$/, '') + '.jpg'
              : `image_${Date.now()}.jpg`;

            const compressedFile = new File([blob], originalName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}


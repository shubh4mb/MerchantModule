import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { getCroppedImg } from "../LogoCrop/utils/cropImage";
import "./BannerCrop.css";

interface BannerCropProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (file: File) => void;
  initialImage?: string | File | null;
}

const BannerCrop: React.FC<BannerCropProps> = ({ isOpen, onClose, onCrop, initialImage }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  React.useEffect(() => {
    if (isOpen && initialImage) {
      if (typeof initialImage === 'string') {
        setImageSrc(initialImage);
      } else if (initialImage instanceof File) {
        const reader = new FileReader();
        reader.addEventListener("load", () => setImageSrc(reader.result as string));
        reader.readAsDataURL(initialImage);
      }
    } else if (!isOpen) {
      setImageSrc(null);
    }
  }, [isOpen, initialImage]);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => setImageSrc(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = async () => {
    try {
      if (!imageSrc || !croppedAreaPixels) return;

      // Get base64 string
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);

      // Convert base64 to File
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], "banner.jpg", { type: "image/jpeg" });

      onCrop(file); // pass File
      setImageSrc(null); // Clear image src for next use
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="banner-crop-overlay">
      <div className="banner-crop-modal">
        <h3 className="text-lg font-bold mb-4">Crop Shop Banner</h3>
        {!imageSrc ? (
          <div className="upload-section border-2 border-dashed border-gray-300 rounded-lg p-8 hover:bg-gray-50 transition-colors">
            <input
              type="file"
              id="banner-upload"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="banner-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </div>
              <span className="text-sm font-medium text-gray-600">Click to upload banner image</span>
              <span className="text-xs text-gray-400">Best ratio: 16:9</span>
            </label>
          </div>
        ) : (
          <>
            <div className="cropper-container h-[250px] relative w-full bg-gray-900 rounded-lg overflow-hidden mb-6">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9} // Banner aspect ratio
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="controls px-4">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-medium text-gray-500">Zoom</span>
                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(_, value) => setZoom(value as number)}
                  sx={{ color: 'black' }}
                />
              </div>
            </div>
          </>
        )}

        <div className="modal-actions flex justify-end gap-3 mt-4 border-t pt-4">
          <button
            onClick={() => {
              setImageSrc(null);
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {imageSrc && (
            <button
              onClick={handleCrop}
              className="px-6 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Apply Crop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerCrop;

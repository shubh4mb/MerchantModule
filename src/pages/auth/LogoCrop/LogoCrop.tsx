import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Slider from "@mui/material/Slider";
import { getCroppedImg } from "./utils/cropImage"; // helper we'll create below
import "./LogoCrop.css";

interface LogoCropProps {
  isOpen: boolean;
  onClose: () => void;
  onCrop: (file: File) => void;
}

const LogoCrop: React.FC<LogoCropProps> = ({ isOpen, onClose, onCrop }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
      const file = new File([blob], "logo.jpg", { type: "image/jpeg" });

      onCrop(file); // pass File
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="logo-crop-overlay">
      <div className="logo-crop-modal">
        {!imageSrc ? (
          <div className="upload-section">
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        ) : (
          <>
            <div className="cropper-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1} // square for logo
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="controls">
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, value) => setZoom(value as number)}
              />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          {imageSrc && (
            <button onClick={handleCrop} className="btn btn-primary">Crop & Save</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoCrop;

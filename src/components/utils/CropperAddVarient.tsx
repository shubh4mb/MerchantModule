import React, { useState, useCallback, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import GetCroppedImg from "../utils/croping/cropImage";
import Modal from "./Modal";
import "./CropperAddVarient.css";

interface CropperModalProps {
  imageSrcs: string[];
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  isUploading?: boolean;
}

const CropperAddVarient: React.FC<CropperModalProps> = ({
  imageSrcs,
  onClose,
  onCropComplete,
  isUploading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect] = useState(9 / 16);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentImageSrc = imageSrcs[currentIndex] || null;

  // Prevent re-render loops — only close once images are empty
  useEffect(() => {
    if (imageSrcs.length === 0) return; // don't trigger onClose automatically
  }, [imageSrcs]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [currentIndex]);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = useCallback(async () => {
    if (!currentImageSrc || !croppedAreaPixels) return;
    try {
      setIsProcessing(true);
      const croppedBlob = await GetCroppedImg(currentImageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);

      if (currentIndex < imageSrcs.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        onClose(); // Close after last image
      }
    } catch (error) {
      console.error("Crop error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentImageSrc, croppedAreaPixels, onCropComplete, currentIndex, imageSrcs.length, onClose]);

  const isDisabled = isProcessing || isUploading;

  // Render nothing if no images
  if (!imageSrcs || imageSrcs.length === 0) return null;

  return (
    <Modal onClose={onClose}>
      <div className="cropper-modal-content">
        <div className="cropper-header">
          <h3>Crop Image {currentIndex + 1} of {imageSrcs.length}</h3>
          <span className="crop-info">Adjust the image to fit the crop area</span>
        </div>

        <div className="cropper-container">
          {currentImageSrc && (
            <Cropper
              image={currentImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid
              style={{ containerStyle: { background: "rgba(0, 0, 0, 0.8)" } }}
            />
          )}
        </div>

        <div className="zoom-container">
          <label htmlFor="zoom-slider">Zoom:</label>
          <input
            id="zoom-slider"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
            disabled={isDisabled}
          />
        </div>

        <div className="controls-container flex justify-center gap-3">
          <button onClick={onClose} className="button button-cancel" disabled={isDisabled}>
            Cancel
          </button>
          <button onClick={handleDone} className="button button-crop" disabled={isDisabled}>
            {isProcessing || isUploading
              ? "Processing..."
              : currentIndex < imageSrcs.length - 1
              ? "Next"
              : "Done"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CropperAddVarient;

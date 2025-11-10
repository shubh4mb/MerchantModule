import React, { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import GetCroppedImg from "../utils/croping/cropImage";
import Modal from "./Modal";
import "./CropperModal.css";

interface CropperModalProps {
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  isUploading?: boolean;
}

const CropperModal: React.FC<CropperModalProps> = ({
  imageSrc,
  onClose,
  onCropComplete,
  isUploading = false,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [aspect, setAspect] = useState<number>(2 / 3); // default 2:3
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    if (!imageSrc || !croppedAreaPixels || isProcessing || isUploading) return;

    setIsProcessing(true);

    try {
      const croppedBlob = await GetCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Error cropping image. Please try again.");
      setIsProcessing(false);
    }
    // parent handles further steps
  };

  const handleCancel = () => {
    if (isProcessing || isUploading) return;
    onClose();
  };

  const isDone = isProcessing || isUploading;
  const getButtonText = (): string => {
    if (isProcessing) return "Cropping...";
    if (isUploading) return "Uploading...";
    return "Crop & Upload";
  };

  return (
    <Modal onClose={onClose}>
      <div className="cropper-modal-content">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <span className="crop-info">Adjust the image to fit the crop area</span>
        </div>

        <div className="cropper-container">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              showGrid={true}
              style={{
                containerStyle: {
                  background: "rgba(0, 0, 0, 0.8)",
                },
              }}
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
            disabled={isDone}
          />
        </div>

        <div className="aspect-ratio-container">
          <label>Aspect Ratio:</label>
          <div className="aspect-buttons">
            <button
              type="button"
              className={`aspect-btn ${aspect === 2 / 3 ? "active" : ""}`}
              onClick={() => setAspect(2 / 3)}
              disabled={isDone}
            >
              2:3 (Portrait)
            </button>
            <button
              type="button"
              className={`aspect-btn ${aspect === 1 ? "active" : ""}`}
              onClick={() => setAspect(1)}
              disabled={isDone}
            >
              1:1 (Square)
            </button>
            <button
              type="button"
              className={`aspect-btn ${aspect === 3 / 2 ? "active" : ""}`}
              onClick={() => setAspect(3 / 2)}
              disabled={isDone}
            >
              3:2 (Landscape)
            </button>
          </div>
        </div>

        <div className="controls-container">
          <button
            onClick={handleCancel}
            className="button button-cancel"
            disabled={isDone}
          >
            Cancel
          </button>

          <button
            onClick={handleDone}
            className="button button-crop"
            disabled={isDone || !croppedAreaPixels}
          >
            {isDone && <div className="button-spinner" />}
            {getButtonText()}
          </button>
        </div>

        {isDone && (
          <div className="processing-overlay">
            <div className="processing-message">
              {isProcessing ? "Cropping image..." : "Uploading image..."}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CropperModal;

// CropperModal.tsx
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./croping/cropImage";
import Modal from "./Modal";
import "./CropperModal.css";

const CropperModal = ({ imageSrc, onClose, onCropComplete, isUploading = false }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  // Fixed aspect ratio to 2:3 (portrait) - good for product images
  const [aspect, setAspect] = useState(2 / 3);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!imageSrc || !croppedAreaPixels || isProcessing || isUploading) return;
    
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Error cropping image. Please try again.');
      setIsProcessing(false);
    }
    // Note: Don't set isProcessing to false here because the parent will handle the upload
    // and close the modal or move to the next image
  };

  const handleCancel = () => {
    if (isProcessing || isUploading) return;
    onClose();
  };

  // Determine the current state for button text and disabled status
  const isDone = isProcessing || isUploading;
  const getButtonText = () => {
    if (isProcessing) return 'Cropping...';
    if (isUploading) return 'Uploading...';
    return 'Crop & Upload';
  };

  return (
    <Modal onClose={isDone ? undefined : onClose}>
      <div className="cropper-modal-content">
        <div className="cropper-header">
          <h3>Crop Image</h3>
          <span className="crop-info">Adjust the image to fit the crop area</span>
        </div>
        
        <div className="cropper-container">
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
                background: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          />
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
              className={`aspect-btn ${aspect === 2/3 ? 'active' : ''}`}
              onClick={() => setAspect(2/3)}
              disabled={isDone}
            >
              2:3 (Portrait)
            </button>
            <button
              type="button"
              className={`aspect-btn ${aspect === 1 ? 'active' : ''}`}
              onClick={() => setAspect(1)}
              disabled={isDone}
            >
              1:1 (Square)
            </button>
            <button
              type="button"
              className={`aspect-btn ${aspect === 3/2 ? 'active' : ''}`}
              onClick={() => setAspect(3/2)}
              disabled={isDone}
            >
              3:2 (Landscape)
            </button>
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
            {isDone && (
              <div className="button-spinner" />
            )}
            {getButtonText()}
          </button>
        </div>
          </div>

        </div>
        


        {isDone && (
          <div className="processing-overlay">
            <div className="processing-message">
              {isProcessing ? 'Cropping image...' : 'Uploading image...'}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CropperModal;
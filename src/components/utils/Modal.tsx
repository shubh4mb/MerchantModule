// Modal.tsx remains unchanged
import React from "react";
import "./CropperModal.css"; // ensures .modal-overlay styles apply

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-inner"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
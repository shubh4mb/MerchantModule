// components/Modal.tsx
import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  return (
    <>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-600 hover:text-black"
        disabled={!onClose}
        aria-disabled={!onClose}
      >
        ✕
      </button>
      {children}
    </>
  );
};

export default Modal;

import React from "react";
import "./ui.css";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onCloseClick: () => void;
}

export const Modal: React.FC<ModalProps> = ({ title, children, onCloseClick }) => (
  <div className="ui-modal-overlay" onClick={onCloseClick}>
    <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
      <div className="ui-modal__header">
        <h2 className="ui-modal__title">{title}</h2>
        <button className="ui-modal__close" onClick={onCloseClick} aria-label="Close">
          ×
        </button>
      </div>
      <div className="ui-modal__body">{children}</div>
    </div>
  </div>
);

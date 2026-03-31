import React from "react";
import "./ui.css";

interface DrawerProps {
  title: string;
  children: React.ReactNode;
  onCloseClick: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({ title, children, onCloseClick }) => (
  <>
    <div className="ui-drawer-overlay" onClick={onCloseClick} />
    <div className="ui-drawer">
      <div className="ui-drawer__header">
        <h2 className="ui-drawer__title">{title}</h2>
        <button className="ui-drawer__close" onClick={onCloseClick} aria-label="Close">
          ×
        </button>
      </div>
      <div className="ui-drawer__body">{children}</div>
    </div>
  </>
);

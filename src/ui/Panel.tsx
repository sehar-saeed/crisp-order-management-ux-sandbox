import React from "react";
import "./ui.css";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({ children, className, style }) => (
  <div className={`ui-panel${className ? ` ${className}` : ""}`} style={style}>
    {children}
  </div>
);

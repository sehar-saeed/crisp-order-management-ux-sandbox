import React from "react";
import "./ui.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, style }) => (
  <div className={`ui-card${className ? ` ${className}` : ""}`} style={style}>
    {children}
  </div>
);

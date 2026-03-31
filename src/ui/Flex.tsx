import React from "react";
import "./ui.css";

interface FlexProps {
  children: React.ReactNode;
  spaceBetween?: boolean;
  style?: React.CSSProperties;
}

export const Flex: React.FC<FlexProps> = ({ children, spaceBetween, style }) => (
  <div
    className={`ui-flex${spaceBetween ? " ui-flex--space-between" : ""}`}
    style={style}
  >
    {children}
  </div>
);

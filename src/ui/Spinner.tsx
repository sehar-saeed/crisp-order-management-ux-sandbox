import React from "react";
import "./ui.css";

interface SpinnerProps {
  color?: string;
  size?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({ color, size = 24 }) => (
  <span
    className="ui-spinner"
    style={{
      width: size,
      height: size,
      ...(color ? { borderTopColor: color } : {}),
    }}
  />
);

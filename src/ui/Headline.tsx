import React from "react";
import "./ui.css";

interface HeadlineProps {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
}

export const Headline: React.FC<HeadlineProps> = ({ as: Tag = "h2", children }) => (
  <Tag className={`ui-headline ui-headline--${Tag}`}>{children}</Tag>
);

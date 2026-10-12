import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", size: _size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" | "lg" }) {
  return <button className={`button button-primary ${_size === "sm" ? "min-h-8 px-3 text-xs" : ""} ${className}`} {...props} />;
}

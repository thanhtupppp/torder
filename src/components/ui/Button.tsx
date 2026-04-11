import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  variant = "primary",
  className = "",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${variant} ${fullWidth ? "full-width" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

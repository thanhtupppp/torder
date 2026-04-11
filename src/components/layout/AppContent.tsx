import type { PropsWithChildren } from "react";

type AppContentProps = PropsWithChildren;

export function AppContent({ children }: AppContentProps) {
  return <main className="content">{children}</main>;
}

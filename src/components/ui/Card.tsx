import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}>;

export function Card({ title, actions, children, className = "" }: CardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <header className="card-header">
          {title ? <h3>{title}</h3> : <span />}
          {actions}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}

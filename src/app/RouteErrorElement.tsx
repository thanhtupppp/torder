import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteErrorElement() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <section className="card">
        <h3>Đã xảy ra lỗi</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {error.status} - {error.statusText}
        </p>
      </section>
    );
  }

  const message = error instanceof Error ? error.message : "Lỗi không xác định";

  return (
    <section className="card">
      <h3>Đã xảy ra lỗi</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {message}
      </p>
    </section>
  );
}

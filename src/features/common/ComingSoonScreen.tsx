type ComingSoonScreenProps = {
  title: string;
  description?: string;
};

export function ComingSoonScreen({
  title,
  description,
}: ComingSoonScreenProps) {
  return (
    <section className="card">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {description ?? "Màn hình này sẽ được triển khai ở bước tiếp theo."}
      </p>
    </section>
  );
}

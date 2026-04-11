import type { CategoryDto } from "../../features/management/dtos/catalog";

type CategorySelectProps = {
  categories: CategoryDto[];
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CategorySelect({
  categories,
  className = "input",
  id,
  name,
  value = "",
  onChange,
  placeholder = "Chọn danh mục",
  disabled,
}: CategorySelectProps) {
  return (
    <select
      id={id}
      name={name}
      className={className}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      aria-label="Danh mục sản phẩm"
    >
      <option value="">{placeholder}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

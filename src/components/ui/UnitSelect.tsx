import { UNIT_OPTIONS, type UnitOption } from "../../constants/units";

type UnitSelectProps = {
  className?: string;
  id?: string;
  name?: string;
  value?: UnitOption | "";
  onChange?: (value: UnitOption | "") => void;
  placeholder?: string;
  disabled?: boolean;
};

export function UnitSelect({
  className = "input",
  id,
  name,
  value = "",
  onChange,
  placeholder = "Chọn đơn vị tính",
  disabled,
}: UnitSelectProps) {
  return (
    <select
      id={id}
      name={name}
      className={className}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const nextValue = event.target.value;
        if (nextValue === "" || UNIT_OPTIONS.includes(nextValue as UnitOption)) {
          onChange?.(nextValue as UnitOption | "");
        }
      }}
      aria-label="Đơn vị tính"
    >
      <option value="">{placeholder}</option>
      {UNIT_OPTIONS.map((unit) => (
        <option key={unit} value={unit}>
          {unit}
        </option>
      ))}
    </select>
  );
}

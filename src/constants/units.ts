export const UNIT_OPTIONS = [
  "Cái",
  "Ly",
  "Chai",
  "Lon",
  "Phần",
  "Dĩa",
  "Tô",
  "Kg",
  "Gram",
  "Hộp",
] as const;

export type UnitOption = (typeof UNIT_OPTIONS)[number];

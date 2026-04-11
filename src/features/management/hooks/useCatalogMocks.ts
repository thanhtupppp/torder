import { useState } from "react";
import type { CategoryDto, ProductDto } from "../dtos/catalog";

type CatalogMocksState = {
  categories: CategoryDto[];
  products: ProductDto[];
  isLoading: boolean;
};

// Khi có fetch thật: thay INITIAL_STATE + thêm useEffect async
const INITIAL_STATE: CatalogMocksState = {
  categories: [],
  products: [],
  isLoading: false,
};

export function useCatalogMocks(): CatalogMocksState {
  const [state] = useState<CatalogMocksState>(INITIAL_STATE);
  return state;
}

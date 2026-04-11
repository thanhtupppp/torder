import { useEffect, useState } from "react";
import type { CategoryDto, ProductDto } from "../dtos/catalog";

type CatalogMocksState = {
  categories: CategoryDto[];
  products: ProductDto[];
  isLoading: boolean;
};

export function useCatalogMocks(): CatalogMocksState {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder loader: intentionally empty for now.
    // Replace this section with real fetch logic later.
    setCategories([]);
    setProducts([]);
    setIsLoading(false);
  }, []);

  return {
    categories,
    products,
    isLoading,
  };
}

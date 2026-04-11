import { getAppApi } from "../../lib/api";

export function salesLoader() {
  const appApi = getAppApi();

  return {
    products: appApi.product.list(),
  };
}

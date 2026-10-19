export const TEST_PRODUCT_NAME = "Fone de Ouvido Bluetooth Sem Fio";

const TEST_PRODUCT_IMAGE = "/fone-bluetooth.svg";

export function isTestProduct(product: { name: string }) {
  return product.name === TEST_PRODUCT_NAME;
}

export function productImageUrl(product: { name: string; image_url: string | null }) {
  return isTestProduct(product) ? TEST_PRODUCT_IMAGE : product.image_url;
}

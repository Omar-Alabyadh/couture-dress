import { getCustomerServiceConfig } from "./config";

export function getShopName(): string {
  return getCustomerServiceConfig().shopName;
}

export function getWhatsappWaMeDigits(): string {
  return getCustomerServiceConfig().whatsappWaMeDigits;
}

export function getPhoneDisplay(): string {
  return getCustomerServiceConfig().phoneDisplay;
}

export function getBranchById(id: string) {
  return getCustomerServiceConfig().branches.find((b) => b.id === id);
}

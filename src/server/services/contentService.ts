import { listCollectionItems } from "@/server/repositories/contentRepository";

export async function getPublicCollectionItems() {
  return listCollectionItems();
}

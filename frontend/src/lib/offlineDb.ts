import Dexie, { Table } from "dexie";
import { Product } from "../types";

export interface QueuedSale {
  id?: number;
  payload: any;
  createdAt: string;
}

/**
 * Offline-first storage for the POS screen.
 * - `products` is a read cache refreshed whenever we're online, so the cashier can keep
 *   searching/selling by barcode even if the connection drops.
 * - `queuedSales` holds checkout payloads created while offline; they sync to the backend
 *   the moment connectivity returns (see hooks/useOnlineSync.ts).
 */
class KenPosOfflineDB extends Dexie {
  products!: Table<Product, string>;
  queuedSales!: Table<QueuedSale, number>;

  constructor() {
    super("kenpos-offline");
    this.version(1).stores({
      products: "_id, sku, barcode, name",
      queuedSales: "++id, createdAt",
    });
  }
}

export const offlineDb = new KenPosOfflineDB();

export async function cacheProducts(products: Product[]) {
  await offlineDb.products.clear();
  await offlineDb.products.bulkPut(products);
}

export async function getCachedProducts(): Promise<Product[]> {
  return offlineDb.products.toArray();
}

export async function queueSale(payload: any) {
  await offlineDb.queuedSales.add({ payload, createdAt: new Date().toISOString() });
}

export async function getQueuedSales(): Promise<QueuedSale[]> {
  return offlineDb.queuedSales.toArray();
}

export async function removeQueuedSale(id: number) {
  await offlineDb.queuedSales.delete(id);
}

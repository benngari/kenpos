import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { getQueuedSales, removeQueuedSale } from "../lib/offlineDb";
import toast from "react-hot-toast";

export type ConnectionStatus = "online" | "offline" | "syncing";

export function useOnlineSync() {
  const [status, setStatus] = useState<ConnectionStatus>(navigator.onLine ? "online" : "offline");

  const syncQueued = useCallback(async () => {
    const queued = await getQueuedSales();
    if (!queued.length) return;
    setStatus("syncing");
    for (const q of queued) {
      try {
        await api.post("/sales/checkout", q.payload);
        if (q.id !== undefined) await removeQueuedSale(q.id);
      } catch (err) {
        console.error("[sync] failed to push queued sale", err);
        break; // stop on first failure, retry later
      }
    }
    toast.success(`Synced ${queued.length} offline sale(s)`);
    setStatus("online");
  }, []);

  useEffect(() => {
    function onOnline() {
      setStatus("online");
      syncQueued();
    }
    function onOffline() {
      setStatus("offline");
      toast.error("You're offline - sales will be queued locally");
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (navigator.onLine) syncQueued();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncQueued]);

  return { status, syncQueued };
}

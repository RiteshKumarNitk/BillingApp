"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChefHat, Clock, Flame, CheckCircle2, Utensils, Globe, RefreshCw } from "lucide-react";

interface KitchenTicket {
  id: string;
  source: "online" | "pos";
  displayId: string;
  status: "ACCEPTED" | "PREPARING" | "READY";
  tableLabel: string | null;
  orderType: string | null;
  customerName: string;
  notes: string | null;
  items: { name: string; quantity: number }[];
  createdAt: string;
}

const POLL_INTERVAL_MS = 10000;

const COLUMNS: { status: KitchenTicket["status"]; label: string; icon: any; nextLabel: string }[] = [
  { status: "ACCEPTED", label: "New", icon: Clock, nextLabel: "Start Preparing" },
  { status: "PREPARING", label: "Preparing", icon: Flame, nextLabel: "Mark Ready" },
  { status: "READY", label: "Ready", icon: CheckCircle2, nextLabel: "Complete" },
];

function elapsed(createdAt: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  return mins < 1 ? "just now" : `${mins}m ago`;
}

export default function KitchenQueueClient() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/tenant/kitchen");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch kitchen tickets:", error);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => {
    const interval = setInterval(() => fetchTickets(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTickets]);
  // Re-render every 30s so "Xm ago" labels stay fresh without needing a full refetch.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const advance = async (ticket: KitchenTicket) => {
    setProcessingId(ticket.id);
    const [kind, uuid] = ticket.id.split(":");
    try {
      let res: Response;
      if (kind === "order") {
        const action = ticket.status === "ACCEPTED" ? "START_PREPARING" : ticket.status === "PREPARING" ? "MARK_READY" : "COMPLETE";
        res = await fetch(`/api/tenant/orders/${uuid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      } else {
        res = await fetch(`/api/tenant/kitchen/transaction/${uuid}`, { method: "PATCH" });
      }
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
        fetchTickets(true);
      }
    } catch (error) {
      console.error("Failed to advance ticket:", error);
    }
    setProcessingId(null);
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-indigo-600" /> Kitchen Queue
          </h1>
          <p className="text-sm text-gray-500 mt-1">Accepted online orders and POS tickets sent to the kitchen</p>
        </div>
        <button
          onClick={() => fetchTickets()}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </header>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading tickets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLUMNS.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="bg-gray-50 rounded-2xl border border-gray-100 p-3 flex flex-col min-h-[200px]">
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                  <col.icon className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-bold text-gray-800">{col.label}</h2>
                  <span className="ml-auto text-xs font-semibold text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {colTickets.length}
                  </span>
                </div>

                {colTickets.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">No tickets</p>
                ) : (
                  <div className="space-y-3">
                    {colTickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            {ticket.source === "online" ? (
                              <Globe className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            <span className="text-xs font-mono text-gray-400">#{ticket.displayId}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{elapsed(ticket.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-semibold text-gray-900">{ticket.customerName}</span>
                          {ticket.tableLabel && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                              {ticket.tableLabel}
                            </span>
                          )}
                          {ticket.orderType && ticket.orderType !== "DINE_IN" && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">
                              {ticket.orderType.replace("_", " ")}
                            </span>
                          )}
                        </div>

                        <ul className="text-xs text-gray-600 space-y-0.5 mb-3">
                          {ticket.items.map((item, idx) => (
                            <li key={idx}>{item.quantity}× {item.name}</li>
                          ))}
                        </ul>

                        {ticket.notes && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mb-3">{ticket.notes}</p>
                        )}

                        <button
                          onClick={() => advance(ticket)}
                          disabled={processingId === ticket.id}
                          className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {processingId === ticket.id ? "Updating…" : col.nextLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

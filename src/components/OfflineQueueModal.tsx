import { X, Clock, CheckCircle2, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { OfflineRecord } from "../types";

interface Props {
  records: OfflineRecord[];
  onClose: () => void;
  onSync: () => void;
  isOnline: boolean;
  syncing?: boolean;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Hardware: "🖥️", Projector: "📽️", AC: "❄️", Electrical: "⚡", Furniture: "🪑",
};

export default function OfflineQueueModal({ records, onClose, onSync, isOnline, syncing }: Props) {
  const pending = records.filter((r) => r.status === "PENDING_SYNC").length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
        style={{
          background: "var(--surface)",
          maxHeight: "80dvh",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Hàng đợi Offline (IndexedDB)
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {records.length} phiếu · {pending} chờ đồng bộ
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 cursor-pointer transition-colors active:scale-95"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
          {records.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <CheckCircle2 size={40} style={{ color: "var(--success)" }} />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Không có phiếu nào trong hàng chờ
              </span>
            </div>
          )}
          {records.map((rec) => {
            const isPending = rec.status === "PENDING_SYNC";
            const isFailed = rec.status === "FAILED";
            return (
              <div
                key={rec.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: isPending ? "var(--border)" : "transparent",
                }}
              >
                <span className="text-xl">{CATEGORY_EMOJI[rec.data.category] || "📋"}</span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {[rec.data.building, rec.data.floor && `T${rec.data.floor}`, rec.data.room].filter(Boolean).join(" · ")}
                  </span>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {rec.data.category || "Chưa phân loại"} · {new Date(rec.timestamp).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
                <span
                  className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-mono font-medium"
                  style={{
                    background: isPending ? "rgba(245,158,11,0.12)" : isFailed ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    color: isPending ? "#d97706" : isFailed ? "var(--danger)" : "var(--success)",
                  }}
                >
                  {isPending ? <Clock size={11} /> : isFailed ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                  {isPending ? "PENDING" : isFailed ? "FAILED" : "SYNCED"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Sync button */}
        {pending > 0 && (
          <div className="px-4 pb-6 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={onSync}
              disabled={!isOnline || syncing}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              style={{
                background: isOnline ? "var(--primary)" : "var(--text-muted)",
                boxShadow: isOnline ? "0 4px 16px rgba(2,132,199,0.35)" : "none",
              }}
            >
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              {syncing
                ? "Đang đồng bộ..."
                : isOnline
                ? `Đồng bộ ${pending} phiếu lên máy chủ`
                : "Không có kết nối mạng"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

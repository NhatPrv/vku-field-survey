import { useState, useEffect, useCallback, useRef } from "react";
import { Wifi, WifiOff, RefreshCw, Sun, Moon, ClipboardList } from "lucide-react";
import FormWizard from "./components/FormWizard";
import OfflineQueueModal from "./components/OfflineQueueModal";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getAllSurveys, addToQueue } from "./services/db";
import { processSyncQueue } from "./services/syncQueue";
import type { SurveyFormData, OfflineRecord } from "./types";

export default function App() {
  const [dark, setDark] = useState(false);
  const { isOnline } = useNetworkStatus();
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Biến lưu trạng thái mạng trước đó để nhận diện thời điểm vừa phục hồi mạng
  const prevOnlineRef = useRef(isOnline);

  // 1. Tải danh sách bản ghi khảo sát từ IndexedDB
  const refreshRecordsFromDb = useCallback(async () => {
    try {
      const dbSurveys = await getAllSurveys();
      const mappedRecords: OfflineRecord[] = dbSurveys.map((item) => ({
        id: item.id,
        data: item.payload,
        status: item.status,
        timestamp: item.createdAt,
      }));
      setRecords(mappedRecords);
    } catch (err) {
      console.error("Lỗi đọc danh sách khảo sát từ IndexedDB:", err);
    }
  }, []);

  useEffect(() => {
    refreshRecordsFromDb();
  }, [refreshRecordsFromDb]);

  // 2. Chuyển đổi Dark/Light mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // 3. Xử lý đồng bộ hàng đợi
  const handleSync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const result = await processSyncQueue();
      await refreshRecordsFromDb();
      if (result.successCount > 0) {
        showToast(`✓ Đã đồng bộ ${result.successCount} phiếu lên máy chủ`);
      } else if (result.failedCount > 0) {
        showToast(`⚠️ Có ${result.failedCount} phiếu đồng bộ thất bại`);
      }
    } catch (err) {
      console.error("Lỗi trong quá trình sync:", err);
      showToast("❌ Lỗi đồng bộ dữ liệu");
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, refreshRecordsFromDb]);

  // 4. Tự động kích hoạt đồng bộ khi vừa khôi phục kết nối mạng (Auto Sync on Reconnect)
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      showToast("🌐 Đã kết nối mạng — Đang tự động đồng bộ...");
      handleSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, handleSync]);

  // 5. Tiếp nhận submit từ FormWizard
  async function handleSubmit(data: SurveyFormData) {
    try {
      const initialStatus = isOnline ? "SYNCED" : "PENDING_SYNC";
      await addToQueue(data, initialStatus);
      await refreshRecordsFromDb();

      if (isOnline) {
        showToast("✓ Phiếu đã gửi & đồng bộ thành công");
      } else {
        showToast("📥 Đã lưu vào IndexedDB — Chờ mạng để đồng bộ");
      }
    } catch (err) {
      console.error("Lỗi lưu phiếu khảo sát:", err);
      showToast("❌ Không thể lưu phiếu khảo sát");
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  const pendingCount = records.filter((r) => r.status === "PENDING_SYNC").length;

  return (
    <div
      className="flex flex-col h-full max-w-md mx-auto overflow-hidden relative shadow-2xl"
      style={{ background: "var(--bg)" }}
    >
      {/* Top Header Bar */}
      <header
        className="flex items-center justify-between px-5 py-3 shrink-0 border-b z-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "var(--primary)" }}
          >
            <ClipboardList size={16} color="white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              VKU Field Survey
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Khảo sát ngoại tuyến (PWA)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Huy hiệu trạng thái mạng */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all select-none"
            style={{
              background: isOnline ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: isOnline ? "var(--success)" : "var(--danger)",
            }}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? "Online" : "Offline"}
          </div>

          {/* Nút chuyển Dark/Light mode */}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
            aria-label="Đổi giao diện Sáng/Tối"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Thân biểu mẫu đa bước */}
      <FormWizard onSubmit={handleSubmit} />

      {/* Thanh nổi dưới đáy khi có phiếu chờ đồng bộ */}
      {pendingCount > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 flex items-center justify-between z-20"
          style={{
            background: "linear-gradient(to top, var(--bg) 75%, transparent)",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto" }} className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => setShowQueue(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border flex-1 justify-center transition-all active:scale-95 cursor-pointer"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}
            >
              <span
                className="w-5 h-5 rounded-full text-xs font-bold font-mono flex items-center justify-center text-white"
                style={{ background: "#f59e0b" }}
              >
                {pendingCount}
              </span>
              <span>{pendingCount} phiếu chờ sync</span>
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={!isOnline || syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              style={{
                background: "var(--primary)",
                boxShadow: "0 4px 16px rgba(2,132,199,0.4)",
              }}
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Đang sync…" : "Sync Now"}
            </button>
          </div>
        </div>
      )}

      {/* Toast thông báo */}
      {toast && (
        <div
          className="absolute top-16 left-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white text-center shadow-lg transition-all"
          style={{
            background: toast.startsWith("✓")
              ? "var(--success)"
              : toast.startsWith("⚠️")
              ? "#d97706"
              : toast.startsWith("❌")
              ? "var(--danger)"
              : "var(--primary)",
            opacity: 0.98,
          }}
        >
          {toast}
        </div>
      )}

      {/* Modal hàng đợi ngoại tuyến */}
      {showQueue && (
        <OfflineQueueModal
          records={records}
          onClose={() => setShowQueue(false)}
          onSync={() => {
            handleSync();
            setShowQueue(false);
          }}
          isOnline={isOnline}
          syncing={syncing}
        />
      )}
    </div>
  );
}

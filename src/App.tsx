import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import FormWizard from "./components/FormWizard";
import OfflineQueueModal from "./components/OfflineQueueModal";
import AdminDashboard from "./components/AdminDashboard";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getAllSurveys, addToQueue } from "./services/db";
import { processSyncQueue } from "./services/syncQueue";
import type { SurveyFormData, OfflineRecord } from "./types";

export default function App() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<"survey" | "admin">("survey");
  const { isOnline } = useNetworkStatus();
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  // 4. Tự động kích hoạt đồng bộ khi vừa khôi phục kết nối mạng
  useEffect(() => {
    if (!prevOnlineRef.current && isOnline) {
      showToast("🌐 Đã có mạng trở lại — Tự động đồng bộ...");
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
      className="flex flex-col h-full w-full max-w-5xl mx-auto md:my-3 md:h-[calc(100vh-1.5rem)] md:rounded-3xl md:border overflow-hidden relative shadow-2xl transition-all"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      {/* Top Header Bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 border-b z-10"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Logo & App Title */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: "var(--primary)" }}
          >
            <ClipboardList size={18} color="white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm md:text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              VKU Field Survey
            </span>
            <span className="text-[11px] md:text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Kiểm định cơ sở vật chất (Offline-First)
            </span>
          </div>
        </div>

        {/* Navigation Tabs Switcher: Khảo sát vs Quản lý */}
        <div
          className="flex items-center p-1 rounded-2xl border"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("survey")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: activeTab === "survey" ? "var(--primary)" : "transparent",
              color: activeTab === "survey" ? "var(--primary-fg)" : "var(--text-secondary)",
              boxShadow: activeTab === "survey" ? "0 2px 8px rgba(2,132,199,0.3)" : "none",
            }}
          >
            <ClipboardList size={14} />
            <span className="hidden sm:inline">Khảo sát</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative"
            style={{
              background: activeTab === "admin" ? "var(--primary)" : "transparent",
              color: activeTab === "admin" ? "var(--primary-fg)" : "var(--text-secondary)",
              boxShadow: activeTab === "admin" ? "0 2px 8px rgba(2,132,199,0.3)" : "none",
            }}
          >
            <LayoutDashboard size={14} />
            <span className="hidden sm:inline">Quản lý</span>
            {records.length > 0 && (
              <span
                className="w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center text-white"
                style={{ background: pendingCount > 0 ? "#f59e0b" : "var(--primary)" }}
              >
                {records.length}
              </span>
            )}
          </button>
        </div>

        {/* Network Badge & Dark/Light Toggle */}
        <div className="flex items-center gap-2">
          {/* Huy hiệu trạng thái mạng */}
          <div
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all select-none"
            style={{
              background: isOnline ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: isOnline ? "var(--success)" : "var(--danger)",
            }}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
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

      {/* Main Content Area */}
      {activeTab === "survey" ? (
        <FormWizard onSubmit={handleSubmit} />
      ) : (
        <AdminDashboard
          records={records}
          onRefresh={refreshRecordsFromDb}
          onSync={handleSync}
          isOnline={isOnline}
          syncing={syncing}
        />
      )}

      {/* Thanh nổi dưới đáy khi có phiếu chờ đồng bộ (chỉ ở tab Survey) */}
      {activeTab === "survey" && pendingCount > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-3 flex items-center justify-between z-20 pointer-events-none"
          style={{ background: "linear-gradient(to top, var(--bg) 75%, transparent)" }}
        >
          <div style={{ pointerEvents: "auto" }} className="flex items-center gap-3 w-full max-w-md mx-auto">
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
          className="absolute top-16 left-4 right-4 z-50 max-w-md mx-auto rounded-xl px-4 py-3 text-sm font-medium text-white text-center shadow-lg transition-all"
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

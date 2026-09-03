import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  ClipboardList,
  Layers,
  Smartphone,
  Download,
  X,
  ExternalLink,
} from "lucide-react";
import FormWizard from "./components/FormWizard";
import OfflineQueueModal from "./components/OfflineQueueModal";
import AdminDashboard from "./components/AdminDashboard";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { getAllQueuedSurveys, enqueueSurvey } from "./services/db";
import { syncPendingSurveys } from "./services/syncService";
import type { SurveyFormData, OfflineRecord } from "./types";

type ClientTab = "survey" | "local_queue";

export default function App() {
  const [dark, setDark] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ClientTab>("survey");
  const { isOnline } = useNetworkStatus();
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [showQueue, setShowQueue] = useState<boolean>(false);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const prevOnlineRef = useRef(isOnline);

  // 1. Tải danh sách bản ghi khảo sát từ IndexedDB của máy
  const refreshRecordsFromDb = useCallback(async () => {
    try {
      const dbSurveys = await getAllQueuedSurveys();
      const mappedRecords: OfflineRecord[] = dbSurveys.map((item) => ({
        id: item.id,
        data: item.payload,
        status: item.status,
        timestamp: item.createdAt,
        serverReceivedAt: item.serverReceivedAt,
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

  // 3. Xử lý đồng bộ hàng đợi lên Server khi có mạng
  const handleSync = useCallback(async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    try {
      const result = await syncPendingSurveys();
      await refreshRecordsFromDb();
      if (result.successCount > 0) {
        showToast(`✓ Đã đồng bộ ${result.successCount} phiếu lên máy chủ trung tâm`);
      } else if (result.stoppedEarly) {
        showToast(`⚠️ Không thể kết nối Backend Server — Dữ liệu được bảo toàn trên máy`);
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
      showToast("🌐 Đã có mạng trở lại — Đang tự động đồng bộ...");
      handleSync();
    }
    prevOnlineRef.current = isOnline;
  }, [isOnline, handleSync]);

  // 5. Tiếp nhận submit từ FormWizard
  async function handleSubmit(data: SurveyFormData) {
    try {
      const initialStatus = isOnline ? "SYNCED" : "PENDING_SYNC";
      await enqueueSurvey(data, initialStatus);
      await refreshRecordsFromDb();

      if (isOnline) {
        handleSync();
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
      className="min-h-screen w-full flex flex-col transition-colors duration-200"
      style={{ background: "var(--bg)" }}
    >
      {/* Top Header Bar - Full Width Responsive */}
      <header
        className="w-full border-b sticky top-0 z-30 shadow-sm backdrop-blur-md"
        style={{
          background: dark ? "rgba(15, 30, 45, 0.85)" : "rgba(255, 255, 255, 0.85)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-sky-600/20"
              style={{ background: "var(--primary)" }}
            >
              <ClipboardList size={20} color="white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                  VKU Field Survey
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-600 border border-sky-500/20">
                  PWA & Native
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Hệ thống Kiểm định Ngoại tuyến Đa Nền tảng
              </span>
            </div>
          </div>

          {/* Navigation Tabs Switcher: Responsive Desktop/Tablet/Mobile */}
          <div
            className="flex items-center p-1.5 rounded-2xl border text-xs font-semibold shadow-inner"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            {/* Tab 1: Khảo sát hiện trường */}
            <button
              type="button"
              onClick={() => setActiveTab("survey")}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl transition-all cursor-pointer font-medium"
              style={{
                background: activeTab === "survey" ? "var(--primary)" : "transparent",
                color: activeTab === "survey" ? "var(--primary-fg)" : "var(--text-secondary)",
                boxShadow: activeTab === "survey" ? "0 2px 10px rgba(2,132,199,0.3)" : "none",
              }}
            >
              <ClipboardList size={15} />
              <span>Khảo sát</span>
            </button>

            {/* Tab 2: Quản lý hàng đợi máy */}
            <button
              type="button"
              onClick={() => setActiveTab("local_queue")}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl transition-all cursor-pointer font-medium"
              style={{
                background: activeTab === "local_queue" ? "var(--primary)" : "transparent",
                color: activeTab === "local_queue" ? "var(--primary-fg)" : "var(--text-secondary)",
                boxShadow: activeTab === "local_queue" ? "0 2px 10px rgba(2,132,199,0.3)" : "none",
              }}
            >
              <Layers size={15} />
              <span>Hàng đợi Máy</span>
              {records.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center text-white"
                  style={{ background: pendingCount > 0 ? "#f59e0b" : "var(--primary)" }}
                >
                  {records.length}
                </span>
              )}
            </button>
          </div>

          {/* Network Badge & Dark/Light Toggle */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all select-none border"
              style={{
                background: isOnline ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                color: isOnline ? "var(--success)" : "var(--danger)",
                borderColor: isOnline ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
              }}
            >
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden md:inline">{isOnline ? "Online" : "Offline"}</span>
            </div>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer border"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
              aria-label="Đổi giao diện Sáng/Tối"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Responsive Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
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
      </main>

      {/* Floating Action Bar: Đồng bộ khi có phiếu pending */}
      {activeTab === "survey" && pendingCount > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 z-40 max-w-md mx-auto pointer-events-auto">
          <div
            className="flex items-center gap-3 p-2 rounded-2xl border shadow-2xl backdrop-blur-lg"
            style={{
              background: dark ? "rgba(15, 30, 45, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setShowQueue(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold flex-1 justify-center transition-all active:scale-95 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              <span className="w-5 h-5 rounded-full text-xs font-mono font-bold flex items-center justify-center text-white bg-amber-500">
                {pendingCount}
              </span>
              <span>{pendingCount} phiếu chờ đồng bộ</span>
            </button>

            <button
              type="button"
              onClick={handleSync}
              disabled={!isOnline || syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer shadow-md"
              style={{ background: "var(--primary)" }}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Đang gửi…" : "Đồng bộ ngay"}
            </button>
          </div>
        </div>
      )}

      {/* Nút Tải APK Android Cố định ở góc dưới phải (Sticky Download Button) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setShowApkModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs text-white shadow-xl shadow-sky-600/30 hover:shadow-sky-600/50 transition-all active:scale-95 cursor-pointer border border-sky-400/30 group"
          style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" }}
          title="Tải ứng dụng Android (APK)"
        >
          <Smartphone size={16} className="group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Cài đặt App Android</span>
          <span className="sm:hidden">Tải APK</span>
          <Download size={13} className="opacity-75" />
        </button>
      </div>

      {/* Modal Hướng dẫn & Tải file APK Android */}
      {showApkModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setShowApkModal(false)}
        >
          <div
            className="max-w-md w-full rounded-3xl border p-6 shadow-2xl flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowApkModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  Ứng dụng Android APK
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Capacitor Native Bridge v8.0
                </span>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 flex flex-col gap-2">
              <p>
                Ứng dụng Android APK chạy <strong>100% độc lập</strong> ngoài màn hình chính, sử dụng camera phần cứng và bộ nhớ lưu trữ ngoại tuyến IndexedDB không cần internet.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <li>Package ID: <code className="text-sky-600 dark:text-sky-400">com.vku.fieldsurvey</code></li>
                <li>Hỗ trợ: Android 8.0 trở lên</li>
                <li>Camera Native + Background Sync</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <a
                href="/download/vku-field-survey.apk"
                download="vku-field-survey.apk"
                className="w-full py-3 rounded-xl text-center text-xs font-bold text-white shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: "var(--primary)" }}
              >
                <Download size={15} />
                Tải file APK trực tiếp (vku-field-survey.apk)
              </a>

              <a
                href="https://github.com/NhatPrv/vku-field-survey/releases"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl text-center text-xs font-medium border flex items-center justify-center gap-1.5 transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-500/5"
                style={{ borderColor: "var(--border)" }}
              >
                <span>Xem bản phát hành trên GitHub Releases</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl px-5 py-3 text-xs font-semibold text-white text-center shadow-xl transition-all animate-bounce"
          style={{
            background: toast.startsWith("✓")
              ? "var(--success)"
              : toast.startsWith("⚠️")
              ? "#d97706"
              : toast.startsWith("❌")
              ? "var(--danger)"
              : "var(--primary)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Modal Hàng đợi Offline cá nhân của người dùng */}
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

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Building2,
  Eye,
  Navigation,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { DEFAULT_SERVER_URL } from "../services/syncService";
import type { QueuedSurvey } from "../types";

const CATEGORY_MAP: Record<string, string> = {
  Hardware: "🖥️ Máy tính",
  Projector: "📽️ Máy chiếu",
  AC: "❄️ Điều hòa",
  Electrical: "⚡ Thiết bị điện",
  Furniture: "🪑 Bàn ghế / CSVC",
};

interface Props {
  onBackToClient?: () => void;
}

export default function ServerAdminPage({ onBackToClient }: Props) {
  const [surveys, setSurveys] = useState<QueuedSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterBuilding, setFilterBuilding] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 1. Fetch dữ liệu từ API máy chủ trung tâm (kèm Fallback Standalone IndexedDB)
  const fetchSurveysFromServer = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${DEFAULT_SERVER_URL}/api/admin/surveys`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        setSurveys(json.surveys || []);
        setServerOnline(true);
      } else {
        setServerOnline(false);
        const { getAllQueuedSurveys } = await import("../services/db");
        const localSurveys = await getAllQueuedSurveys();
        setSurveys(localSurveys);
      }
    } catch {
      // Khi server tắt/không kết nối được: Tự động tải từ IndexedDB trên thiết bị
      setServerOnline(false);
      try {
        const { getAllQueuedSurveys } = await import("../services/db");
        const localSurveys = await getAllQueuedSurveys();
        setSurveys(localSurveys);
      } catch {
        // Fallback im lặng
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Thiết lập Polling 10s & Realtime SSE
  useEffect(() => {
    fetchSurveysFromServer();

    // Auto-refresh: Poll mỗi 10 giây theo đặc tả
    const timer = setInterval(() => {
      fetchSurveysFromServer(true);
    }, 10000);

    // Kênh realtime SSE nếu hỗ trợ
    let sse: EventSource | null = null;
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        sse = new EventSource(`${DEFAULT_SERVER_URL}/api/admin/events`);
        sse.onmessage = () => {
          fetchSurveysFromServer(true);
        };
      } catch (e) {
        console.warn("[ServerAdminPage] SSE không khả dụng:", e);
      }
    }

    return () => {
      clearInterval(timer);
      if (sse) sse.close();
    };
  }, [fetchSurveysFromServer]);

  // 3. Xóa một bản ghi khảo sát theo ID
  async function handleDelete(id: string) {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn phiếu [${id}]?`)) return;
    try {
      if (serverOnline) {
        await fetch(`${DEFAULT_SERVER_URL}/api/admin/surveys/${id}`, {
          method: "DELETE",
        });
      }
      const { deleteSurvey } = await import("../services/db");
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch {
      try {
        const { deleteSurvey } = await import("../services/db");
        await deleteSurvey(id);
        setSurveys((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        alert("Lỗi khi xóa bản ghi: " + err);
      }
    }
  }

  // 4. Tính toán các chỉ số Analytics Cards
  const metrics = useMemo(() => {
    const total = surveys.length;
    // Điểm đánh giá <= 2 là sự cố nghiêm trọng
    const critical = surveys.filter((s) => (s.payload?.rating || 0) > 0 && (s.payload?.rating || 0) <= 2).length;
    // Điểm đánh giá >= 4 là tình trạng tốt
    const good = surveys.filter((s) => (s.payload?.rating || 0) >= 4).length;
    return {
      total,
      critical,
      good,
      criticalRate: total > 0 ? Math.round((critical / total) * 100) : 0,
      goodRate: total > 0 ? Math.round((good / total) * 100) : 0,
    };
  }, [surveys]);

  // 5. Lọc danh sách dữ liệu
  const filteredSurveys = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return surveys.filter((s) => {
      const p = s.payload;
      if (!p) return false;

      const matchSearch =
        !term ||
        p.room.toLowerCase().includes(term) ||
        p.building.toLowerCase().includes(term) ||
        (p.notes || "").toLowerCase().includes(term);

      const matchBuilding = filterBuilding === "ALL" || p.building === filterBuilding;
      const matchCategory = filterCategory === "ALL" || p.category === filterCategory;

      let matchSeverity = true;
      if (filterSeverity === "CRITICAL") {
        matchSeverity = p.rating > 0 && p.rating <= 2;
      } else if (filterSeverity === "GOOD") {
        matchSeverity = p.rating >= 4;
      } else if (filterSeverity === "AVERAGE") {
        matchSeverity = p.rating === 3;
      }

      return matchSearch && matchBuilding && matchCategory && matchSeverity;
    });
  }, [surveys, searchTerm, filterBuilding, filterCategory, filterSeverity]);

  // 6. Xuất CSV & JSON
  function exportCsv() {
    if (surveys.length === 0) return;
    const headers = [
      "ID",
      "ThoiGianTiepNhan",
      "ToaNha",
      "Tang",
      "Phong",
      "LoaiThietBi",
      "DanhGiaSao",
      "ViDo_Lat",
      "KinhDo_Lng",
      "GhiChu",
    ];
    const rows = surveys.map((s) => [
      `"${s.id}"`,
      `"${s.serverReceivedAt || s.createdAt}"`,
      `"${s.payload.building}"`,
      `"${s.payload.floor || ""}"`,
      `"${s.payload.room}"`,
      `"${s.payload.category}"`,
      s.payload.rating,
      s.payload.latitude ?? "",
      s.payload.longitude ?? "",
      `"${(s.payload.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vku-audits-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportJson() {
    if (surveys.length === 0) return;
    const blob = new Blob([JSON.stringify(surveys, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vku-audits-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & KPI ANALYTICS CARDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Cổng Quản trị Máy chủ Trung tâm (Server Admin Portal)
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp dữ liệu kiểm định CSVC toàn trường tiếp nhận qua RESTful API
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchSurveysFromServer()}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span>Làm mới</span>
          </button>
          {onBackToClient && (
            <button
              type="button"
              onClick={onBackToClient}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Về Client Form
            </button>
          )}
        </div>
      </div>

      {/* 4 THẺ ANALYTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audits */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            Tổng số phiếu tiếp nhận
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-sky-500">{metrics.total}</span>
            <Building2 size={22} className="text-sky-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1">Bản ghi toàn trường</span>
        </div>

        {/* Card 2: Critical Defects */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col"
          style={{ background: "var(--surface)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-rose-500">
            Sự cố nghiêm trọng (≤ 2★)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-rose-500">{metrics.critical}</span>
            <ShieldAlert size={22} className="text-rose-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-rose-600/80 mt-1">
            {metrics.criticalRate}% cần thanh tra xử lý gấp
          </span>
        </div>

        {/* Card 3: Good Condition */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col"
          style={{ background: "var(--surface)", borderColor: "rgba(34,197,94,0.3)" }}
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-emerald-500">
            Tình trạng tốt (≥ 4★)
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold font-mono text-emerald-500">{metrics.good}</span>
            <Sparkles size={22} className="text-emerald-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-emerald-600/80 mt-1">
            {metrics.goodRate}% phòng học đạt chuẩn
          </span>
        </div>

        {/* Card 4: Server Status */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            Trạng thái máy chủ
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${serverOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
              />
              <span className={`text-xl font-bold font-mono ${serverOnline ? "text-emerald-500" : "text-rose-500"}`}>
                {serverOnline ? "Online (200)" : "Mất kết nối"}
              </span>
            </div>
            <CheckCircle2 size={22} className="text-emerald-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1">Auto-refresh 10s + Realtime</span>
        </div>
      </div>

      {/* 2. FILTER TOOLBAR & EXPORT BUTTONS */}
      <div
        className="p-4 rounded-2xl border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Ô tìm kiếm */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo phòng, tòa nhà, sự cố ghi chú…"
            className="w-full pl-10 pr-4 py-2 text-xs font-mono rounded-xl border outline-none transition-all"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Dropdowns lọc */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc Tòa nhà */}
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <option value="ALL">Tất cả Tòa</option>
            <option value="Dãy A">Dãy A</option>
            <option value="Dãy B">Dãy B</option>
            <option value="Dãy C">Dãy C</option>
            <option value="Tòa V">Tòa V</option>
            <option value="KTX">Ký túc xá</option>
          </select>

          {/* Lọc Danh mục Thiết bị */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <option value="ALL">Tất cả Thiết bị</option>
            <option value="Hardware">🖥️ Máy tính</option>
            <option value="Projector">📽️ Máy chiếu</option>
            <option value="AC">❄️ Điều hòa</option>
            <option value="Electrical">⚡ Điện</option>
            <option value="Furniture">🪑 CSVC/Bàn ghế</option>
          </select>

          {/* Lọc Mức độ Sao (Severity) */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-xl border outline-none cursor-pointer"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <option value="ALL">Tất cả Mức độ</option>
            <option value="CRITICAL">⚠️ Nghiêm trọng (≤ 2★)</option>
            <option value="AVERAGE">⚡ Trung bình (3★)</option>
            <option value="GOOD">✓ Chuẩn / Tốt (≥ 4★)</option>
          </select>

          {/* Nút Xuất CSV */}
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="Xuất bảng tính CSV"
          >
            <FileSpreadsheet size={14} />
            <span>Xuất CSV</span>
          </button>

          {/* Nút Xuất JSON */}
          <button
            type="button"
            onClick={exportJson}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer shadow-sm"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="Xuất file JSON"
          >
            <Download size={14} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 3. CENTRAL DATA TABLE */}
      <div
        className="rounded-2xl border shadow-sm overflow-hidden flex flex-col"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Thời gian tiếp nhận</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Vị trí (Tòa-Tầng-Phòng)</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Thiết bị</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Đánh giá (1-5★)</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Tọa độ GPS</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500">Ghi chú sự cố</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500 text-center">Ảnh hiện trường</th>
                <th className="py-3 px-4 font-mono font-semibold uppercase text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    Đang đồng bộ dữ liệu từ máy chủ trung tâm...
                  </td>
                </tr>
              ) : filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    Chưa có phiếu khảo sát nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((item) => {
                  const p = item.payload;
                  const dateStr = item.serverReceivedAt || item.createdAt;
                  const formattedDate = new Date(dateStr).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  });
                  const isCritical = (p.rating || 0) <= 2;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-sky-500/5 transition-colors"
                      style={{ background: isCritical ? "rgba(239,68,68,0.02)" : "transparent" }}
                    >
                      {/* 1. Thời gian */}
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{formattedDate}</td>

                      {/* 2. Vị trí */}
                      <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                        {p.building} · {p.floor ? `T${p.floor}` : ""} · {p.room}
                      </td>

                      {/* 3. Thiết bị */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                          {CATEGORY_MAP[p.category] || p.category || "—"}
                        </span>
                      </td>

                      {/* 4. Đánh giá */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className="text-amber-500 font-bold">{"★".repeat(p.rating || 0)}</span>
                        <span className="text-slate-300 dark:text-slate-700">
                          {"☆".repeat(Math.max(0, 5 - (p.rating || 0)))}
                        </span>
                      </td>

                      {/* 5. Tọa độ GPS */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        {p.latitude && p.longitude ? (
                          <a
                            href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-500 font-semibold"
                            title="Mở tọa độ trên Google Maps"
                          >
                            <Navigation size={12} />
                            <span>
                              {p.latitude.toFixed(4)}°, {p.longitude.toFixed(4)}°
                            </span>
                            <ExternalLink size={10} className="opacity-70" />
                          </a>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* 6. Ghi chú */}
                      <td
                        className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300"
                        title={p.notes || ""}
                      >
                        {p.notes || "—"}
                      </td>

                      {/* 7. Ảnh hiện trường */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {p.photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(p.photoUrl)}
                            className="relative group inline-block w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer"
                          >
                            <img src={p.photoUrl} alt="Hiện trường" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye size={12} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 8. Thao tác Xóa */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-2.5 py-1 rounded-lg font-mono text-[11px] text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                          title="Xóa phiếu khỏi máy chủ"
                        >
                          <Trash2 size={13} className="inline mr-1" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM ẢNH HIỆN TRƯỜNG PHÓNG TO */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-2xl w-full rounded-3xl overflow-hidden border shadow-2xl relative"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Ảnh minh chứng hiện trường (Phóng to)
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img src={previewImage} alt="Phóng to" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

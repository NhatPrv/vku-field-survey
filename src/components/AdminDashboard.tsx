import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Building2,
  Eye,
} from "lucide-react";
import { deleteSurvey, markAsSynced } from "../services/db";
import type { OfflineRecord, SyncStatus } from "../types";

interface Props {
  records: OfflineRecord[];
  onRefresh: () => void;
  onSync: () => void;
  isOnline: boolean;
  syncing?: boolean;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Hardware: "🖥️",
  Projector: "📽️",
  AC: "❄️",
  Electrical: "⚡",
  Furniture: "🪑",
};

export default function AdminDashboard({ records, onRefresh, onSync, isOnline, syncing }: Props) {
  // Bộ lọc tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | SyncStatus>("ALL");

  // State xem ảnh phóng to
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 1. Tính toán các chỉ số KPI Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => r.status === "PENDING_SYNC").length;
    const synced = records.filter((r) => r.status === "SYNCED").length;
    const critical = records.filter((r) => r.data.rating > 0 && r.data.rating <= 2).length;
    const criticalRate = total > 0 ? Math.round((critical / total) * 100) : 0;

    return { total, pending, synced, critical, criticalRate };
  }, [records]);

  // 2. Lọc danh sách khảo sát theo điều kiện
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        !searchTerm ||
        rec.data.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.data.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.data.notes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBuilding = filterBuilding === "ALL" || rec.data.building === filterBuilding;
      const matchCategory = filterCategory === "ALL" || rec.data.category === filterCategory;
      const matchStatus = filterStatus === "ALL" || rec.status === filterStatus;

      return matchSearch && matchBuilding && matchCategory && matchStatus;
    });
  }, [records, searchTerm, filterBuilding, filterCategory, filterStatus]);

  // 3. Xử lý xóa bản ghi
  async function handleDelete(id: string) {
    if (window.confirm("Bạn có chắc chắn muốn xóa bản ghi khảo sát này không?")) {
      try {
        await deleteSurvey(id);
        onRefresh();
      } catch (err) {
        console.error("Lỗi xóa bản ghi:", err);
      }
    }
  }

  // 4. Thử đồng bộ lại một bản ghi đơn lẻ
  async function handleRetryRecord(id: string) {
    if (!isOnline) {
      alert("Thiết bị đang ngoại tuyến! Vui lòng kết nối mạng để đồng bộ.");
      return;
    }
    try {
      await markAsSynced(id);
      onRefresh();
    } catch (err) {
      console.error("Lỗi cập nhật sync:", err);
    }
  }

  // 5. Xuất dữ liệu JSON
  function exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `vku-survey-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // 6. Xuất dữ liệu CSV
  function exportCsv() {
    const headers = ["ID", "Tòa nhà", "Tầng", "Phòng", "Danh mục", "Đánh giá", "Ghi chú", "Trạng thái", "Thời gian"];
    const rows = records.map((r) => [
      r.id,
      r.data.building,
      r.data.floor,
      r.data.room,
      r.data.category,
      r.data.rating,
      `"${(r.data.notes || "").replace(/"/g, '""')}"`,
      r.status,
      r.timestamp,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vku-survey-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 7. Xóa các bản ghi đã SYNCED để giải phóng dung lượng
  async function handleClearSynced() {
    const syncedRecords = records.filter((r) => r.status === "SYNCED");
    if (syncedRecords.length === 0) {
      alert("Không có phiếu đã đồng bộ nào để xóa.");
      return;
    }
    if (window.confirm(`Xóa ${syncedRecords.length} phiếu đã đồng bộ khỏi bộ nhớ máy?`)) {
      for (const rec of syncedRecords) {
        await deleteSurvey(rec.id);
      }
      onRefresh();
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 gap-6">
      {/* 1. KHỐI THỐNG KÊ METRICS CARDS (4 thẻ) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {/* Total */}
        <div
          className="flex flex-col p-4 md:p-5 rounded-2xl border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
            Tổng số phiếu
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>
              {metrics.total}
            </span>
            <Building2 size={20} className="text-sky-600 opacity-70" />
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1">Lưu trong IndexedDB</span>
        </div>

        {/* Pending Sync */}
        <div
          className="flex flex-col p-4 md:p-5 rounded-2xl border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "rgba(245,158,11,0.3)" }}
        >
          <span className="text-xs font-mono font-medium text-amber-600 uppercase tracking-wider">
            Chờ đồng bộ
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-amber-500">
              {metrics.pending}
            </span>
            <Clock size={20} className="text-amber-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-amber-700/70 mt-1">Cần đẩy lên server</span>
        </div>

        {/* Synced */}
        <div
          className="flex flex-col p-4 md:p-5 rounded-2xl border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "rgba(34,197,94,0.3)" }}
        >
          <span className="text-xs font-mono font-medium text-emerald-600 uppercase tracking-wider">
            Đã đồng bộ
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-emerald-500">
              {metrics.synced}
            </span>
            <CheckCircle2 size={20} className="text-emerald-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-emerald-700/70 mt-1">Đã lên hệ thống</span>
        </div>

        {/* Critical defect rate */}
        <div
          className="flex flex-col p-4 md:p-5 rounded-2xl border shadow-sm"
          style={{ background: "var(--surface)", borderColor: "rgba(239,68,68,0.3)" }}
        >
          <span className="text-xs font-mono font-medium text-rose-600 uppercase tracking-wider">
            Sự cố nghiêm trọng
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl md:text-3xl font-bold font-mono text-rose-500">
              {metrics.criticalRate}%
            </span>
            <AlertTriangle size={20} className="text-rose-500 opacity-80" />
          </div>
          <span className="text-[11px] font-mono text-rose-700/70 mt-1">{metrics.critical} phòng đánh giá ≤ 2★</span>
        </div>
      </div>

      {/* 2. BỘ LỌC & TÌM KIẾM & HÀNH ĐỘNG HÀNG LOẠT */}
      <div
        className="flex flex-col gap-4 p-4 md:p-5 rounded-2xl border shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo phòng, tòa nhà, ghi chú…"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all focus:ring-2"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Các nút hành động hàng loạt (Batch Actions) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {metrics.pending > 0 && (
              <button
                type="button"
                onClick={onSync}
                disabled={!isOnline || syncing}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--primary)" }}
              >
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                <span>Sync Tất Cả ({metrics.pending})</span>
              </button>
            )}

            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              title="Tải bảng tính CSV"
            >
              <FileSpreadsheet size={14} />
              <span>Xuất CSV</span>
            </button>

            <button
              type="button"
              onClick={exportJson}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
              title="Tải file JSON"
            >
              <Download size={14} />
              <span>JSON</span>
            </button>

            {metrics.synced > 0 && (
              <button
                type="button"
                onClick={handleClearSynced}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl border transition-all active:scale-95 cursor-pointer text-slate-500 hover:text-red-500"
                style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                title="Xóa phiếu đã đồng bộ để giải phóng bộ nhớ"
              >
                <Trash2 size={13} />
                <span>Dọn dẹp</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
          {/* Lọc Tòa nhà */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Filter size={11} /> Tòa nhà
            </span>
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="ALL">Tất cả tòa</option>
              <option value="Dãy A">Dãy A</option>
              <option value="Dãy B">Dãy B</option>
              <option value="Dãy C">Dãy C</option>
              <option value="Tòa V">Tòa V</option>
              <option value="KTX">KTX</option>
            </select>
          </div>

          {/* Lọc Thiết bị */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Filter size={11} /> Thiết bị
            </span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="ALL">Tất cả thiết bị</option>
              <option value="Hardware">🖥️ Máy tính</option>
              <option value="Projector">📽️ Máy chiếu</option>
              <option value="AC">❄️ Điều hòa</option>
              <option value="Electrical">⚡ Điện</option>
              <option value="Furniture">🪑 Nội thất</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Filter size={11} /> Trạng thái
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "ALL" | SyncStatus)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none cursor-pointer"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_SYNC">Chờ đồng bộ</option>
              <option value="SYNCED">Đã đồng bộ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU KHẢO SÁT (SURVEYS DATA TABLE) */}
      <div
        className="flex flex-col rounded-2xl border overflow-hidden shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Danh sách Phiếu Kiểm định ({filteredRecords.length})
          </span>
          <span className="text-xs font-mono text-slate-400">
            Cơ chế lưu trữ Offline-First
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-mono uppercase text-slate-400 text-[11px]" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Vị trí</th>
                <th className="py-3 px-4">Thiết bị</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-center">Ảnh</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 font-mono">
                    Không tìm thấy bản ghi khảo sát nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isPending = rec.status === "PENDING_SYNC";
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/5 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Thời gian */}
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(rec.timestamp).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>

                      {/* Vị trí */}
                      <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                        {rec.data.building} · {rec.data.floor ? `T${rec.data.floor}` : ""} · {rec.data.room}
                      </td>

                      {/* Thiết bị */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--text-primary)" }}>
                          <span>{CATEGORY_EMOJI[rec.data.category] || "📋"}</span>
                          <span>{rec.data.category || "—"}</span>
                        </span>
                      </td>

                      {/* Đánh giá */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <span className="text-amber-500 font-bold">
                          {"★".repeat(rec.data.rating)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          {"☆".repeat(Math.max(0, 5 - rec.data.rating))}
                        </span>
                      </td>

                      {/* Ghi chú */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={rec.data.notes}>
                        {rec.data.notes || "—"}
                      </td>

                      {/* Ảnh minh chứng */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {rec.data.photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(rec.data.photoUrl)}
                            className="relative group inline-block w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer"
                          >
                            <img src={rec.data.photoUrl} alt="Hiện trường" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <Eye size={12} />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold"
                          style={{
                            background: isPending ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
                            color: isPending ? "#d97706" : "var(--success)",
                          }}
                        >
                          {isPending ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                          {isPending ? "PENDING" : "SYNCED"}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => handleRetryRecord(rec.id)}
                              className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                              title="Thử đồng bộ lại"
                            >
                              <RefreshCw size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Xóa phiếu"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PHÓNG TO ẢNH HIỆN TRƯỜNG */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-sm font-semibold text-white">Ảnh chụp hiện trường thực tế</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/40 max-h-[75vh] overflow-hidden">
              <img src={previewImage} alt="Phóng to hiện trường" className="max-h-[70vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server,
  Activity,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import type { QueuedSurvey } from '../types';
import { DEFAULT_SERVER_URL } from '../services/syncService';

interface ServerHealth {
  status: 'UP' | 'DOWN';
  timestamp?: string;
  totalSurveysReceived?: number;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Hardware: '🖥️',
  Projector: '📽️',
  AC: '❄️',
  Electrical: '⚡',
  Furniture: '🪑',
};

export default function ServerAdminPage() {
  const [serverUrl, setServerUrl] = useState<string>(DEFAULT_SERVER_URL);
  const [surveys, setSurveys] = useState<QueuedSurvey[]>([]);
  const [serverHealth, setServerHealth] = useState<ServerHealth>({ status: 'DOWN' });
  const [loading, setLoading] = useState<boolean>(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 1. Fetch dữ liệu khảo sát từ Server Express
  const fetchServerData = useCallback(async () => {
    try {
      setLoading(true);
      // Kiểm tra sức khỏe máy chủ
      const healthRes = await fetch(`${serverUrl}/api/health`, { method: 'GET' });
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setServerHealth({
          status: 'UP',
          timestamp: healthData.timestamp,
          totalSurveysReceived: healthData.totalSurveysReceived,
        });
      } else {
        setServerHealth({ status: 'DOWN' });
      }

      // Lấy danh sách phiếu khảo sát
      const surveysRes = await fetch(`${serverUrl}/api/admin/surveys`, { method: 'GET' });
      if (surveysRes.ok) {
        const data = await surveysRes.json();
        setSurveys(data.surveys || []);
      }
    } catch {
      setServerHealth({ status: 'DOWN' });
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  // 2. Polling tự động làm mới dữ liệu mỗi 10 giây
  useEffect(() => {
    fetchServerData();
    const intervalId = setInterval(() => {
      fetchServerData();
    }, 10000); // 10s auto-refresh
    return () => clearInterval(intervalId);
  }, [fetchServerData]);

  // 3. Xóa bản ghi trên máy chủ
  async function handleDeleteServerRecord(id: string) {
    if (!window.confirm(`Bạn có chắc muốn xóa bản ghi [${id}] trên máy chủ trung tâm không?`)) {
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/api/admin/surveys/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSurveys((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert('Không thể xóa bản ghi trên máy chủ.');
      }
    } catch (err) {
      console.error('Lỗi khi gọi API DELETE:', err);
      alert('Lỗi kết nối máy chủ khi xóa bản ghi.');
    }
  }

  // 4. Tính toán số liệu thống kê máy chủ
  const metrics = useMemo(() => {
    const total = surveys.length;
    const critical = surveys.filter(
      (s) => s.payload.rating > 0 && s.payload.rating <= 2
    ).length;
    const criticalPercent = total > 0 ? Math.round((critical / total) * 100) : 0;
    return { total, critical, criticalPercent };
  }, [surveys]);

  // 5. Lọc dữ liệu hiển thị
  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.payload.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.payload.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.payload.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchBuilding =
        selectedBuilding === 'ALL' || s.payload.building === selectedBuilding;
      const matchCategory =
        selectedCategory === 'ALL' || s.payload.category === selectedCategory;

      return matchSearch && matchBuilding && matchCategory;
    });
  }, [surveys, searchQuery, selectedBuilding, selectedCategory]);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 sm:px-8 py-6 gap-6 w-full max-w-6xl mx-auto">
      {/* HEADER QUẢN TRỊ SERVER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div className="flex items-center gap-2">
            <Server size={22} className="text-sky-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Cổng Quản trị Máy chủ Trung tâm (Server Portal)
            </h1>
          </div>
          <p className="text-xs sm:text-sm font-mono text-slate-500 mt-1">
            Tổng hợp dữ liệu khảo sát hiện trường toàn trường VKU qua RESTful API
          </p>
        </div>

        {/* Server Endpoint Bar & Refresh Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <span className="text-slate-400">Host:</span>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold w-40 text-slate-700 dark:text-slate-200"
            />
          </div>

          <button
            type="button"
            onClick={fetchServerData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            style={{ background: 'var(--primary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* METRIC SUMMARY CARDS (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Server Status */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
              Trạng thái Máy chủ
            </span>
            <Radio
              size={18}
              className={serverHealth.status === 'UP' ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                serverHealth.status === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span
              className={`text-2xl font-bold font-mono ${
                serverHealth.status === 'UP' ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {serverHealth.status === 'UP' ? 'ONLINE (Port 5000)' : 'DISCONNECTED'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-2">
            Tự động thăm dò chu kỳ 10 giây/lần
          </span>
        </div>

        {/* Card 2: Total Received */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
              Phiếu Đã Tiếp Nhận
            </span>
            <ShieldCheck size={20} className="text-sky-600 opacity-80" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              {metrics.total}
            </span>
            <span className="text-xs font-mono text-slate-500 ml-2">bản ghi</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-2">
            Đã đồng bộ vào cơ sở dữ liệu trung tâm
          </span>
        </div>

        {/* Card 3: Critical Issues */}
        <div
          className="p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
          style={{ background: 'var(--surface)', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-rose-600 uppercase tracking-wider">
              Sự cố nghiêm trọng (≤ 2★)
            </span>
            <AlertTriangle size={20} className="text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-rose-500">
              {metrics.critical}
            </span>
            <span className="text-xs font-mono text-rose-600/70 font-semibold">
              ({metrics.criticalPercent}% tổng số phòng)
            </span>
          </div>
          <span className="text-[11px] font-mono text-rose-700/70 mt-2">
            Yêu cầu phòng Quản trị CSVC xử lý gấp
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div
        className="p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {/* Search box */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo phòng, tòa nhà, sự cố…"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border outline-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">Tất cả tòa</option>
              <option value="Dãy A">Dãy A</option>
              <option value="Dãy B">Dãy B</option>
              <option value="Dãy C">Dãy C</option>
              <option value="Tòa V">Tòa V</option>
              <option value="KTX">Ký túc xá</option>
            </select>
          </div>

          <div className="flex-1 md:flex-initial">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="ALL">Tất cả thiết bị</option>
              <option value="Hardware">🖥️ Máy tính</option>
              <option value="Projector">📽️ Máy chiếu</option>
              <option value="AC">❄️ Điều hòa</option>
              <option value="Electrical">⚡ Điện</option>
              <option value="Furniture">🪑 Nội thất</option>
            </select>
          </div>
        </div>
      </div>

      {/* FULL DATA TABLE */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm flex flex-col"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-sky-600" />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Danh sách Phiếu Máy chủ ({filteredSurveys.length})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Node.js Express Storage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b font-mono uppercase text-slate-400 text-[11px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
              >
                <th className="py-3 px-4">Thời gian nhận</th>
                <th className="py-3 px-4">Vị trí</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Đánh giá</th>
                <th className="py-3 px-4">Mô tả sự cố</th>
                <th className="py-3 px-4 text-center">Ảnh</th>
                <th className="py-3 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    {serverHealth.status === 'DOWN'
                      ? '⚠️ Không thể kết nối với Backend Server tại port 5000. Hãy khởi động server: npm run server'
                      : 'Chưa có phiếu khảo sát nào được đẩy lên máy chủ.'}
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/5 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Received Timestamp */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {item.serverReceivedAt
                        ? new Date(item.serverReceivedAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })
                        : new Date(item.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                      {item.payload.building} · {item.payload.floor ? `Tầng ${item.payload.floor}` : ''} · {item.payload.room}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                        <span>{CATEGORY_EMOJI[item.payload.category] || '📋'}</span>
                        <span>{item.payload.category || '—'}</span>
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span className="text-amber-500 font-bold">
                        {'★'.repeat(item.payload.rating)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">
                        {'☆'.repeat(Math.max(0, 5 - item.payload.rating))}
                      </span>
                    </td>

                    {/* Defect Notes */}
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300" title={item.payload.notes}>
                      {item.payload.notes || 'Không có ghi chú'}
                    </td>

                    {/* Thumbnail Photo */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {item.payload.photoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto(item.payload.photoUrl)}
                          className="relative group inline-block w-8 h-8 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 cursor-pointer"
                        >
                          <img
                            src={item.payload.photoUrl}
                            alt="Minh chứng"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Eye size={12} />
                          </div>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteServerRecord(item.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                        title="Xóa khỏi cơ sở dữ liệu máy chủ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <ExternalLink size={15} /> Ảnh chụp hiện trường nhận từ thiết bị kiểm định
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/40 max-h-[75vh] overflow-hidden">
              <img
                src={previewPhoto}
                alt="Phóng to hiện trường"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

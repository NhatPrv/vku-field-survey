import { Camera, RotateCcw, MapPin, Tag, Star, FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { capturePhoto, readFileAsDataUrl } from "../services/camera";
import type { SurveyFormData } from "../types";

const CATEGORY_EMOJI: Record<string, string> = {
  Hardware: "🖥️", Projector: "📽️", AC: "❄️", Electrical: "⚡", Furniture: "🪑",
};

const STARS = ["", "Rất kém", "Kém", "Trung bình", "Tốt", "Xuất sắc"];

interface Props {
  data: SurveyFormData;
  onChange: (d: Partial<SurveyFormData>) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function StepReviewPhoto({ data, onChange, onBack, onSubmit }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loadingCamera, setLoadingCamera] = useState(false);

  // Chụp ảnh qua Capacitor Camera Native Plugin
  async function handleCapacitorCamera() {
    try {
      setLoadingCamera(true);
      const photoDataUrl = await capturePhoto();
      if (photoDataUrl) {
        onChange({ photoUrl: photoDataUrl });
      }
    } catch {
      // Nếu plugin native bị lỗi (môi trường web desktop), mở input file dự phòng
      fileRef.current?.click();
    } finally {
      setLoadingCamera(false);
    }
  }

  // Fallback đọc file qua web thông thường
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange({ photoUrl: dataUrl });
    } catch (err) {
      console.error("Lỗi đọc file:", err);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Camera box */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Ảnh hiện trường (@capacitor/camera)
        </label>
        <div
          className="relative rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center"
          style={{
            background: "var(--surface)",
            borderColor: data.photoUrl ? "var(--primary)" : "var(--border)",
            minHeight: "180px",
          }}
        >
          {data.photoUrl ? (
            <>
              <img
                src={data.photoUrl}
                alt="Ảnh hiện trường"
                className="w-full h-48 object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={() => {
                  onChange({ photoUrl: null });
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute top-2 right-2 rounded-full p-2 flex items-center gap-1 text-xs font-medium cursor-pointer"
                style={{ background: "rgba(0,0,0,0.65)", color: "#fff" }}
              >
                <RotateCcw size={14} />
                Chụp lại
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 px-4 w-full">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCapacitorCamera}
                  disabled={loadingCamera}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 cursor-pointer"
                  style={{ background: "var(--surface-2)", borderColor: "var(--primary)" }}
                >
                  <Camera size={26} style={{ color: "var(--primary)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    {loadingCamera ? "Đang mở..." : "Camera Native"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 cursor-pointer"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <Upload size={26} style={{ color: "var(--text-secondary)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Chọn tệp ảnh
                  </span>
                </button>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Hỗ trợ Camera phần cứng Android & Web File Upload
              </span>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      {/* Review card */}
      <div className="flex flex-col gap-0 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: "var(--primary)" }}
        >
          <FileText size={14} color="rgba(255,255,255,0.9)" />
          <span className="text-xs font-mono font-medium text-white tracking-widest uppercase">
            Tóm tắt phiếu kiểm định
          </span>
        </div>

        {[
          {
            icon: <MapPin size={14} />,
            label: "Vị trí",
            value: [data.building, data.floor && `Tầng ${data.floor}`, data.room].filter(Boolean).join(" · ") || "—",
          },
          {
            icon: <Tag size={14} />,
            label: "Thiết bị",
            value: data.category ? `${CATEGORY_EMOJI[data.category]} ${data.category}` : "—",
          },
          {
            icon: <Star size={14} />,
            label: "Đánh giá",
            value: data.rating ? `${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)} ${STARS[data.rating]}` : "—",
          },
          {
            icon: <FileText size={14} />,
            label: "Ghi chú",
            value: data.notes || "Không có",
          },
        ].map(({ icon, label, value }, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-start gap-3 border-b last:border-b-0"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }}>{icon}</span>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-sm font-medium break-words" style={{ color: "var(--text-primary)", fontFamily: label === "Đánh giá" ? "var(--font-mono)" : "var(--font-sans)" }}>
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-all active:scale-95 cursor-pointer"
          style={{
            background: "var(--surface)",
            color: "var(--text-secondary)",
            borderColor: "var(--border)",
          }}
        >
          ← Quay lại
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-[2] py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 cursor-pointer"
          style={{
            background: "var(--primary)",
            boxShadow: "0 4px 16px rgba(2,132,199,0.4)",
          }}
        >
          Lưu & Gửi ✓
        </button>
      </div>
    </div>
  );
}

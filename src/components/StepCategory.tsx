import { AlertCircle } from "lucide-react";
import StarRating from "./StarRating";
import type { SurveyFormData } from "../types";

type CategoryKey = "Hardware" | "Projector" | "AC" | "Electrical" | "Furniture";

const CATEGORIES: { key: CategoryKey; label: string; emoji: string; desc: string }[] = [
  { key: "Hardware", label: "Máy tính", emoji: "🖥️", desc: "PC, Laptop, Màn hình" },
  { key: "Projector", label: "Máy chiếu", emoji: "📽️", desc: "Projector, Màn chiếu" },
  { key: "AC", label: "Điều hòa", emoji: "❄️", desc: "AC, Quạt, Thông gió" },
  { key: "Electrical", label: "Điện", emoji: "⚡", desc: "Ổ cắm, Đèn, CB" },
  { key: "Furniture", label: "Nội thất", emoji: "🪑", desc: "Bàn, Ghế, Bảng" },
];

interface Props {
  data: SurveyFormData;
  onChange: (d: Partial<SurveyFormData>) => void;
}

export default function StepCategory({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Category grid */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Loại thiết bị
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ key, label, emoji, desc }) => {
            const active = data.category === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ category: key })}
                className="flex flex-col items-start gap-1 rounded-2xl px-4 py-3 border text-left transition-all active:scale-95 cursor-pointer"
                style={{
                  background: active ? "var(--primary)" : "var(--surface)",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  boxShadow: active ? "0 4px 14px rgba(2,132,199,0.35)" : "none",
                }}
              >
                <span className="text-2xl leading-none">{emoji}</span>
                <span
                  className="text-sm font-semibold leading-tight"
                  style={{ color: active ? "var(--primary-fg)" : "var(--text-primary)" }}
                >
                  {label}
                </span>
                <span
                  className="text-xs leading-tight"
                  style={{ color: active ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}
                >
                  {desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Star rating */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Đánh giá tình trạng
        </label>
        <div
          className="rounded-2xl border py-5 flex items-center justify-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <StarRating value={data.rating} onChange={(v) => onChange({ rating: v })} />
        </div>
      </div>

      {/* Defect notes */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <AlertCircle size={12} />
          Ghi chú sự cố
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={4}
          placeholder="Mô tả chi tiết hư hỏng, sự cố hoặc cần lưu ý…"
          className="w-full rounded-xl px-4 py-3 text-sm border outline-none resize-none transition-all focus:ring-2 leading-relaxed"
          style={{
            background: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: data.notes ? "var(--primary)" : "var(--border)",
            fontFamily: "var(--font-sans)",
            "--tw-ring-color": "var(--primary)",
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

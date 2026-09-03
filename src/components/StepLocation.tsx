import { MapPin } from "lucide-react";
import type { SurveyFormData } from "../types";

const BUILDINGS = ["Dãy A", "Dãy B", "Dãy C", "Tòa V", "KTX"];
const FLOORS = ["Hầm", "1", "2", "3", "4", "5"];

interface Props {
  data: SurveyFormData;
  onChange: (d: Partial<SurveyFormData>) => void;
}

export default function StepLocation({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={18} style={{ color: "var(--primary)" }} />
        <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          Thông tin vị trí
        </span>
      </div>

      {/* Building pill selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Dãy / Tòa nhà
        </label>
        <div className="flex flex-wrap gap-2">
          {BUILDINGS.map((b) => {
            const active = data.building === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => onChange({ building: b })}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 cursor-pointer"
                style={{
                  background: active ? "var(--primary)" : "var(--surface-2)",
                  color: active ? "var(--primary-fg)" : "var(--text-secondary)",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floor dropdown */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Tầng
        </label>
        <div className="relative">
          <select
            value={data.floor}
            onChange={(e) => onChange({ floor: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-sm font-medium appearance-none border outline-none transition-all focus:ring-2"
            style={{
              background: "var(--surface)",
              color: data.floor ? "var(--text-primary)" : "var(--text-muted)",
              borderColor: data.floor ? "var(--primary)" : "var(--border)",
              fontFamily: "var(--font-mono)",
              "--tw-ring-color": "var(--primary)",
            } as React.CSSProperties}
          >
            <option value="">— Chọn tầng —</option>
            {FLOORS.map((f) => (
              <option key={f} value={f}>{f === "Hầm" ? "Hầm" : `Tầng ${f}`}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Room number input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Số phòng
        </label>
        <input
          type="text"
          value={data.room}
          onChange={(e) => onChange({ room: e.target.value })}
          placeholder="VD: A101, Lab AI, B305…"
          className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all focus:ring-2"
          style={{
            background: "var(--surface)",
            color: "var(--text-primary)",
            borderColor: data.room ? "var(--primary)" : "var(--border)",
            fontFamily: "var(--font-mono)",
            "--tw-ring-color": "var(--primary)",
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

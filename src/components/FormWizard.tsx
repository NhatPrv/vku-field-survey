import { useState, useEffect, useRef } from "react";
import { Check, Save } from "lucide-react";
import StepLocation from "./StepLocation";
import StepCategory from "./StepCategory";
import StepReviewPhoto from "./StepReviewPhoto";
import { getDraft, saveDraft, clearDraft } from "../services/db";
import type { SurveyFormData } from "../types";

const STEPS = [
  { num: 1, label: "Vị trí" },
  { num: 2, label: "Thiết bị" },
  { num: 3, label: "Ảnh & Xét duyệt" },
];

const EMPTY: SurveyFormData = {
  building: "", floor: "", room: "",
  category: "", rating: 0, notes: "", photoUrl: null,
};

interface Props {
  onSubmit: (data: SurveyFormData) => void;
}

export default function FormWizard({ onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SurveyFormData>(EMPTY);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // 1. Phục hồi bản nháp từ IndexedDB khi mở ứng dụng
  useEffect(() => {
    getDraft()
      .then((savedDraft) => {
        if (savedDraft && (savedDraft.building || savedDraft.room || savedDraft.category)) {
          setData((prev) => ({ ...prev, ...savedDraft }));
          setAutoSaveStatus("Đã khôi phục bản nháp");
          setTimeout(() => setAutoSaveStatus(null), 2500);
        }
      })
      .catch((err) => console.error("Lỗi phục hồi bản nháp:", err))
      .finally(() => setIsDraftLoaded(true));
  }, []);

  // 2. Tự động lưu bản nháp theo thời gian thực (Debounce 400ms)
  function patch(partial: Partial<SurveyFormData>) {
    setData((prev) => {
      const updated = { ...prev, ...partial };

      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        saveDraft(updated)
          .then(() => {
            setAutoSaveStatus("Đã tự động lưu nháp");
            setTimeout(() => setAutoSaveStatus(null), 1800);
          })
          .catch((err) => console.error("Lỗi lưu nháp:", err));
      }, 400);

      return updated;
    });
  }

  function next() { setStep((s) => Math.min(s + 1, 3)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  function canNext() {
    if (step === 1) return !!(data.building && data.floor && data.room.trim());
    if (step === 2) return !!(data.category && data.rating > 0);
    return true;
  }

  async function handleSubmit() {
    onSubmit(data);
    await clearDraft(); // Xóa nháp khi đã submit thành công
    setData(EMPTY);
    setStep(1);
  }

  if (!isDraftLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm font-mono" style={{ color: "var(--text-muted)" }}>
          Đang tải dữ liệu nháp...
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 w-full max-w-4xl mx-auto rounded-3xl border shadow-sm overflow-hidden my-auto transition-all"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Auto-save status indicator */}
      {autoSaveStatus && (
        <div
          className="flex items-center justify-center gap-1.5 py-1.5 px-4 text-xs font-mono border-b transition-all"
          style={{
            background: "var(--surface-2)",
            color: "var(--primary)",
            borderColor: "var(--border)",
          }}
        >
          <Save size={13} />
          <span>{autoSaveStatus}</span>
        </div>
      )}

      {/* Step progress bar */}
      <div
        className="flex items-center justify-between px-6 sm:px-10 pt-5 pb-4 gap-0"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        {STEPS.map((s, i) => {
          const done = step > s.num;
          const active = step === s.num;
          return (
            <div key={s.num} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? "1 1 0" : "none" }}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all"
                  style={{
                    background: done ? "var(--primary)" : active ? "var(--primary)" : "var(--surface-2)",
                    color: done || active ? "var(--primary-fg)" : "var(--text-muted)",
                    boxShadow: active ? "0 0 0 3px rgba(2,132,199,0.2)" : "none",
                  }}
                >
                  {done ? <Check size={14} strokeWidth={2.5} /> : s.num}
                </div>
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: active ? "var(--primary)" : "var(--text-muted)" }}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all"
                  style={{ background: done ? "var(--primary)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-7">
        {step === 1 && <StepLocation data={data} onChange={patch} />}
        {step === 2 && <StepCategory data={data} onChange={patch} />}
        {step === 3 && (
          <StepReviewPhoto
            data={data}
            onChange={patch}
            onBack={back}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Bottom nav for steps 1-2 */}
      {step < 3 && (
        <div
          className="px-5 md:px-8 py-4 md:py-5 border-t flex gap-4"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-all active:scale-95 cursor-pointer"
              style={{
                background: "var(--surface)",
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
            >
              ← Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canNext()}
            className="flex-[2] py-3.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            style={{
              background: canNext() ? "var(--primary)" : "var(--text-muted)",
              boxShadow: canNext() ? "0 4px 16px rgba(2,132,199,0.35)" : "none",
            }}
          >
            Tiếp theo →
          </button>
        </div>
      )}
    </div>
  );
}

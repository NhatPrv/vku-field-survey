import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const labels = ["", "Rất kém", "Kém", "Trung bình", "Tốt", "Xuất sắc"];
  const active = hovered || value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onTouchStart={() => setHovered(n)}
            onTouchEnd={() => { onChange(n); setHovered(0); }}
            onClick={() => onChange(n)}
            className="p-1 rounded-lg transition-transform active:scale-90"
            aria-label={`${n} sao`}
          >
            <Star
              size={32}
              className="transition-colors"
              style={{
                fill: n <= active ? "var(--star-active)" : "var(--star-inactive)",
                stroke: n <= active ? "var(--star-active)" : "var(--star-inactive)",
              }}
            />
          </button>
        ))}
      </div>
      <span
        className="text-sm font-medium font-mono transition-opacity"
        style={{
          color: active ? "var(--star-active)" : "var(--text-muted)",
          opacity: active ? 1 : 0.5,
        }}
      >
        {active ? labels[active] : "Chưa đánh giá"}
      </span>
    </div>
  );
}

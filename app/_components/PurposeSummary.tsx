"use client";
type Props = {
  purposes: string[];
  onRemove: (p: string) => void;
};
export default function PurposeSummary({ purposes, onRemove }: Props) {
  if (!Array.isArray(purposes) || purposes.length === 0) {
    return (
      <div className="mt-3 text-sm text-[color:var(--fg-muted)]" aria-live="polite">
        目的を選ぶとここに表示されます
      </div>
    );
  }
  return (
    <div className="mt-3 text-sm" aria-live="polite">
      <span className="mr-2 text-[color:var(--fg-muted)]">選択中：</span>
      {purposes.map((p) => (
        <span key={p} className="purpose-pill">
          {p}
          <button
            type="button"
            aria-label={`${p} を外す`}
            className="pill-x"
            onClick={() => onRemove(p)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

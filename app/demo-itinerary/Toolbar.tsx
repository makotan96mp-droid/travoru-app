"use client";
import * as React from "react";

type Density = "cozy" | "compact";

type Props = {
  onReset: () => void;
  onAdd: () => void;
  onToday: () => void;
  density: Density;
  onToggleDensity: () => void;
  showDistance: boolean;
  onToggleDistance: () => void;
  onToggleMenu: () => void;
  /** 例: "5.7km" や "850m"。未指定なら非表示 */
  distanceLabel?: string;
  /** 右端のメニュー（省略可） */
  menu?: React.ReactNode;
  className?: string;

  menuOpen: boolean;
};

/**
 * 決定版ツールバー（DOM順で確定）
 * 並び順: reset | add | today | size | distance | move | menu
 */
export default function Toolbar({
  onReset,
  onAdd,
  onToday,
  density,
  onToggleDensity,
  showDistance,
  onToggleDistance,
  distanceLabel,
  menu,
  className = "",
  onToggleMenu,
  menuOpen,
}: Props) {
  return (
    <div
      data-toolbar="true"
      className={[
        "flex items-center gap-2 px-2 py-1",
        "rounded-xl border border-white/15 bg-white/5 backdrop-blur",
        "text-sm",
        className,
      ].join(" ")}
    >
      {/* 左: メイン操作（順序はこのDOM順で確定） */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-slot="reset"
          onClick={onReset}
          className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
          title="リセット"
        >
          Reset
        </button>

        <button
          type="button"
          data-slot="add"
          onClick={onAdd}
          className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
          title="予定を追加"
        >
          ＋ 予定を追加
        </button>

        <button
          type="button"
          data-slot="today"
          onClick={onToday}
          className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
          title="今日の日付にする"
        >
          今日
        </button>

        <button
          type="button"
          data-slot="size"
          onClick={onToggleDensity}
          className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
          title="表示の大きさ"
        >
          表示の大きさ
          <span className="ml-1 opacity-70">({density === "compact" ? "小" : "標準"})</span>
        </button>

        <button
          type="button"
          data-slot="distance"
          onClick={onToggleDistance}
          className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
          title="距離の表示切替"
          aria-pressed={showDistance}
        >
          距離 表示📍
        </button>
      </div>

      {/* 中央: move（移動目安） */}
      {distanceLabel ? (
        <span data-slot="move" title="本日の移動目安" className="ml-2 text-[13px] opacity-80">
          移動 {distanceLabel}
        </span>
      ) : null}

      {/* 右端: メニュー */}
      <div data-slot="menu" className="ml-auto">
        {menu ?? (
          <button
            type="button"
            className="px-2 py-1 rounded-md border border-white/20 hover:bg-white/10"
            title="メニュー"
            aria-label="メニュー"
            onClick={onToggleMenu}
            data-testid="menu-btn"
            aria-haspopup="menu"
            aria-controls="menu-panel"
            aria-expanded={menuOpen}
            data-slot="menu"
          >
            メニュー⋯
          </button>
        )}
      </div>
    </div>
  );
}

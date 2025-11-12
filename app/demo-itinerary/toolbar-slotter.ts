export {};

(function slotter() {
  if (typeof window === "undefined") return;

  const ensureBtn = (el: Element | null | undefined): HTMLElement | null =>
    (el ? (el as HTMLElement).closest('button,[role="button"]') : null) as HTMLElement | null;

  const update = () => {
    try {
      const tb = document.querySelector('[data-toolbar="true"]') as HTMLElement | null;
      if (!tb) return;

      const btns = Array.from(tb.querySelectorAll('button,[role="button"]')) as HTMLElement[];
      const text = (el: Element) => (el.textContent || "").trim();
      const title = (el: Element) => (el.getAttribute("title") || "").trim();
      const aria = (el: Element) => (el.getAttribute("aria-label") || "").trim().toLowerCase();

      const by = {
        reset: () => btns.find((b) => text(b) === "Reset"),
        add: () =>
          btns.find((b) => title(b) === "予定を追加" || /^[＋+]\s*予定を追加$/.test(text(b))),
        today: () => btns.find((b) => title(b) === "今日の日付にする" || text(b) === "今日"),
        size: () => btns.find((b) => title(b) === "表示の大きさ"),
        distance: () => btns.find((b) => title(b) === "距離の表示切替" || /^距離\s/.test(text(b))),
        move: () => {
          const tsel = '[title="本日の移動目安"], [aria-label="本日の移動目安"]';
          const el1 = tb.querySelector(tsel) as HTMLElement | null;
          if (el1) return el1;
          const cand = Array.from(tb.querySelectorAll("span,div")).find((e) =>
            /^\s*移動\s/i.test(e.textContent || ""),
          );
          return cand as HTMLElement | null;
        },
        menu: () => {
          const c1 = tb.querySelector(
            '[aria-label="その他"],[aria-label="メニュー"],[aria-label="More"],[aria-label="Menu"]',
          );
          const c2 = btns.find((b) => /メニュー|More/i.test(text(b)));
          return ensureBtn(c1) || ensureBtn(c2);
        },
      } as const;

      (Object.keys(by) as Array<keyof typeof by>).forEach((k) => {
        const raw = by[k]?.() as HTMLElement | null | undefined;
        const btn = (
          raw ? (raw as HTMLElement).closest('button,[role="button"]') : null
        ) as HTMLElement | null;

        // まずはボタン自身に data-slot
        if (btn && !btn.getAttribute("data-slot")) {
          btn.setAttribute("data-slot", String(k));
        }

        // 次に、ツールバー直下ラッパーにも data-slot（Shadow DOMや特殊ラッパー対策）
        if (raw) {
          const tb = document.querySelector('[data-toolbar="true"]') as HTMLElement | null;
          if (tb) {
            let w = raw as HTMLElement;
            while (w && w.parentElement && w.parentElement !== tb)
              w = w.parentElement as HTMLElement;
            if (w && w.parentElement === tb && !w.getAttribute("data-slot")) {
              w.setAttribute("data-slot", String(k));
            }
          }
        }
      });
    } catch {}
  };

  // 初回＋DOM変化で追随（DOMは移動しない）
  const mo = new MutationObserver(update);
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("load", update, { once: true });
  requestAnimationFrame(update);
})();

// === normalizeToolbarOrder: host(ボタン群)の中で slot ラッパーを並べ、host 自体は左寄せ ===
(function normalizeToolbarOrder() {
  type Slot = "reset" | "add" | "today" | "size" | "distance" | "move" | "menu";
  const ORDER: Record<Slot, number> = {
    reset: 10,
    add: 20,
    today: 30,
    size: 40,
    distance: 50,
    move: 60,
    menu: 999,
  };

  function nearestWrapper(host: HTMLElement, el: Element): HTMLElement | null {
    let w: Element | null = el;
    while (w && w.parentElement && w.parentElement !== host) w = w.parentElement;
    return w && w.parentElement === host ? (w as HTMLElement) : null;
  }

  function ensureWrapper(host: HTMLElement, slot: Slot): HTMLElement {
    let w = host.querySelector<HTMLElement>(`:scope > [data-slot="${slot}"]`);
    if (!w) {
      w = document.createElement("span");
      w.setAttribute("data-slot", slot);
      host.appendChild(w);
    }
    w.style.display = "flex";
    w.style.setProperty("order", String(ORDER[slot] ?? 1000), "important");
    if (slot === "menu") w.style.marginLeft = "auto";
    return w;
  }

  function findBtn(scope: HTMLElement, slot: Exclude<Slot, "move">): HTMLElement | null {
    const tagged = scope.querySelector<HTMLElement>(
      `:is(button,[role="button"])[data-slot="${slot}"]`,
    );
    if (tagged) return tagged;

    const candidates = Array.from(
      scope.querySelectorAll<HTMLElement>('button,[role="button"],[title],[aria-label]'),
    );

    return (
      candidates.find((el) => {
        const title = (el.getAttribute("title") || "").trim();
        const aria = (el.getAttribute("aria-label") || "").trim();
        const text = (el.textContent || "").trim();

        if (slot === "today") return title.includes("今日") || text === "今日";
        if (slot === "add") return /予定を追加/.test(title) || /予定を追加/.test(text);
        if (slot === "size") return /表示の大きさ/.test(title) || /表示の大きさ/.test(text);
        if (slot === "distance") return /距離/.test(title) || /^距離\s/.test(text);
        if (slot === "reset") return text === "Reset";
        if (slot === "menu") return /メニュー|More/i.test(title || aria || text);
        return false;
      }) ?? null
    );
  }

  function normalize(): void {
    const tb = document.querySelector<HTMLElement>('[data-toolbar="true"]');
    if (!tb) return;
    tb.style.setProperty("display", "flex", "important");
    tb.style.setProperty("align-items", "center", "important");
    tb.style.setProperty("flex-wrap", "nowrap", "important");

    tb.style.setProperty("display", "flex", "important");
    tb.style.setProperty("align-items", "center", "important");
    tb.style.setProperty("flex-wrap", "nowrap", "important");

    // host = ボタン群コンテナ（tb直下でボタンを内包する子）。見つからなければ tb 自身。
    const host =
      tb.querySelector<HTMLElement>(':scope > :is(div,span,section):has(button,[role="button"])') ??
      tb;

    /*__HOST_FORCED__*/
    host.style.display = "flex";
    host.style.gap = ".5rem";
    host.style.setProperty("align-items", "center", "important");
    host.style.setProperty("flex-wrap", "nowrap", "important");
    host.style.setProperty("order", "5", "important");
    /*__HOST_FORCED__*/

    host.style.display = "flex";
    host.style.gap = ".5rem";
    host.style.setProperty("order", "5", "important");

    // main 5：host 直下のラッパーで並べる
    (["reset", "add", "today", "size", "distance"] as const).forEach((slot) => {
      // ボタンは tb 全体から探索（host配下にいるはずだが保険）
      const btn = findBtn(tb, slot);

      // ---- DOM 並べ替えで確定（CSS orderに依存しない）----
      (["reset", "add", "today", "size", "distance"] as const).forEach((sl) => {
        const w = host.querySelector<HTMLElement>(`[data-slot="${sl}"]`);

        // ---- 強制ラッパー作成 & 最終並べ替え（DOM順で固定）----
        (() => {
          const tb = document.querySelector<HTMLElement>('[data-toolbar="true"]');
          if (!tb) return;
          const host =
            (Array.from(tb.children).find((el) =>
              (el as HTMLElement).querySelector('button,[role="button"]'),
            ) as HTMLElement) || tb;

          (["reset", "add", "today", "size", "distance"] as const).forEach((sl) => {
            // ラッパーを必ず用意
            const wrap =
              host.querySelector<HTMLElement>(`:scope > [data-slot="${sl}"]`) ||
              (() => {
                const w = document.createElement("span");
                w.setAttribute("data-slot", sl);
                w.style.display = "flex";
                return (host.appendChild(w), w);
              })();

            // ボタンを確実に包む
            const btn =
              tb.querySelector<HTMLElement>(
                `button[data-slot="${sl}"],[role="button"][data-slot="${sl}"]`,
              ) ||
              tb.querySelector<HTMLElement>(
                `:is(button,[role="button"])${sl === "today" ? ":-internal-any" : ""}`,
              );
            if (btn && btn.parentElement !== wrap) wrap.appendChild(btn);

            // ラッパーを DOM 末尾へ再配置（= 視覚順を確定）
            host.appendChild(wrap);
          });
        })();
        if (w) host.appendChild(w);
      });
      if (!btn) return;
      btn.setAttribute("data-slot", slot);
      const wrap = ensureWrapper(host, slot);
      if (nearestWrapper(host, btn) !== wrap) wrap.appendChild(btn);

      /*__FINAL_FIX__*/
      try {
        const ORDER: any = {
          reset: 10,
          add: 20,
          today: 30,
          size: 40,
          distance: 50,
          move: 60,
          menu: 999,
        };
        const tb = document.querySelector<HTMLElement>('[data-toolbar="true"]');
        if (tb) {
          // move
          const mv = tb.querySelector<HTMLElement>(':scope > [data-slot="move"]');
          if (mv) {
            mv.style.setProperty("position", "static", "important");
            mv.style.setProperty("display", "flex", "important");
            mv.style.setProperty("align-items", "center", "important");
            mv.style.setProperty("order", String(ORDER.move), "important");
          }
          // menu
          const mn = tb.querySelector<HTMLElement>(':scope > [data-slot="menu"]');
          if (mn) {
            mn.style.setProperty("position", "static", "important");
            mn.style.setProperty("display", "flex", "important");
            mn.style.setProperty("align-items", "center", "important");
            mn.style.setProperty("order", String(ORDER.menu), "important");
            mn.style.marginLeft = "auto";
          }
          // host (保険)
          const host =
            (Array.from(tb.children).find((el) =>
              (el as HTMLElement).querySelector('button,[role="button"]'),
            ) as HTMLElement) || tb;
          host.style.setProperty("display", "flex", "important");
          host.style.setProperty("align-items", "center", "important");
          host.style.setProperty("flex-wrap", "nowrap", "important");
          host.style.setProperty("order", "5", "important");
        }
      } catch {} /*__FINAL_FIX__*/
    });

    // move（tb 直下。order=60 固定）
    const moveRaw = tb.querySelector<HTMLElement>(
      ':scope > [data-slot="move"], [data-slot="move"]',
    );
    if (moveRaw) {
      let mw = moveRaw;
      if (moveRaw.parentElement !== tb) {
        mw = ensureWrapper(tb, "move");
        if (moveRaw !== mw && !mw.contains(moveRaw)) mw.appendChild(moveRaw);
      }
      mw.style.display = "flex";
      mw.style.setProperty("order", String(ORDER.move), "important");
    }

    // menu（tb 直下。右端固定）
    const menuBtn = findBtn(tb, "menu");
    if (menuBtn) {
      menuBtn.setAttribute("data-slot", "menu");
      const mw = ensureWrapper(tb, "menu");
      if (menuBtn.parentElement !== mw) mw.appendChild(menuBtn);
      mw.style.display = "flex";
      mw.style.setProperty("order", String(ORDER.menu), "important");
      mw.style.marginLeft = "auto";
    }
  }

  try {
    normalize();
  } catch {}
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      try {
        normalize();
      } catch {}
    },
    { once: true },
  );
  requestAnimationFrame(() => {
    try {
      normalize();
    } catch {}
  });
  new MutationObserver(() => {
    try {
      normalize();
    } catch {}
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true });
})();

/*__ULTIMATE_FINAL_FIX__*/
(() => {
  try {
    const tb = document.querySelector<HTMLElement>('[data-toolbar="true"]');
    if (!tb) return;
    const host =
      (Array.from(tb.children).find((el) =>
        (el as HTMLElement).querySelector?.('button,[role="button"]'),
      ) as HTMLElement) || tb;

    const seq = ["reset", "add", "today", "size", "distance"] as const;
    type Slot = (typeof seq)[number];
    const rank: Record<Slot, number> = { reset: 10, add: 20, today: 30, size: 40, distance: 50 };

    host.style.setProperty("display", "flex", "important");
    host.style.setProperty("align-items", "center", "important");
    host.style.setProperty("flex-wrap", "nowrap", "important");

    seq.forEach((sl: Slot) => {
      const wrap = host.querySelector<HTMLElement>(`:scope > [data-slot="${sl}"]`);
      const btn =
        wrap?.querySelector<HTMLElement>('button,[role="button"]') ||
        tb.querySelector<HTMLElement>(
          `button[data-slot="${sl}"],[role="button"][data-slot="${sl}"]`,
        );
      const r = String(rank[sl]);

      if (wrap) {
        wrap.style.setProperty("order", r, "important");
        host.appendChild(wrap);
      }
      if (btn) {
        btn.style.setProperty("order", r, "important");
        if (!wrap && btn.parentElement === host) host.appendChild(btn);
      }
    });
  } catch (e) {}
})();
/*__ULTIMATE_FINAL_FIX__*/

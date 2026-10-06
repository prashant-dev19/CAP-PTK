import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, PanelTop, Plus, RotateCcw, Trash2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { DEFAULT_MENU } from "@/context/SiteContent";

const PAGES = [
  { key: "squads", label: "Squads page", desc: "The squad rosters page (/squads)" },
  { key: "notices", label: "Notices page", desc: "The full notice board (/notices)" },
  { key: "register", label: "Register page", desc: "The player registration form (/register)" },
];

function Toggle({ checked, onChange, label, desc, testid }) {
  return (
    <label
      className="flex items-center justify-between gap-4 border border-gold/10 rounded-lg px-5 py-4 cursor-pointer select-none hover:border-gold/30 transition-colors"
      data-testid={`${testid}-row`}
    >
      <span>
        <span className="block text-sm text-ivory font-medium">{label}</span>
        <span className="block text-[0.62rem] text-ivory/40 mt-0.5">{desc}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testid}
        className="w-4 h-4 accent-[#CFA858] shrink-0"
      />
    </label>
  );
}

export default function MenuTab() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/menu")
      .then(({ data }) =>
        setForm({
          items: data?.items?.length ? data.items.map((i) => ({ ...i })) : DEFAULT_MENU.items.map((i) => ({ ...i })),
          show_register_cta: data?.show_register_cta !== false,
          pages: { ...DEFAULT_MENU.pages, ...(data?.pages || {}) },
        })
      )
      .catch(() =>
        setForm({
          items: DEFAULT_MENU.items.map((i) => ({ ...i })),
          show_register_cta: true,
          pages: { ...DEFAULT_MENU.pages },
        })
      );
  }, []);

  if (!form) {
    return (
      <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
        <Loader2 size={18} className="animate-spin" /> Loading menu…
      </div>
    );
  }

  const setItem = (idx, key, value) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)) }));

  const move = (idx, dir) =>
    setForm((f) => {
      const items = [...f.items];
      const j = idx + dir;
      if (j < 0 || j >= items.length) return f;
      [items[idx], items[j]] = [items[j], items[idx]];
      return { ...f, items };
    });

  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [...f.items, { id: `new-${Date.now()}`, label: "", url: "", enabled: true }],
    }));

  const reset = () =>
    setForm({
      items: DEFAULT_MENU.items.map((i) => ({ ...i })),
      show_register_cta: true,
      pages: { ...DEFAULT_MENU.pages },
    });

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    if (form.items.some((i) => (i.url || "").trim() && !(i.label || "").trim())) {
      setErr("Give every menu item a name before saving.");
      setBusy(false);
      return;
    }
    try {
      const payload = {
        items: form.items.map((i) => ({ label: (i.label || "").trim(), url: (i.url || "").trim(), enabled: !!i.enabled })),
        show_register_cta: form.show_register_cta,
        pages: form.pages,
      };
      const { data } = await api.put("/admin/menu", payload);
      if (data?.pending) {
        setMsg("Submitted — an admin must approve it before it goes live.");
      } else {
        setForm({ items: data.items, show_register_cta: data.show_register_cta, pages: data.pages });
        setMsg("Menu & pages saved — the site navigation updates instantly.");
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        setErr("Session expired — please reload the page and sign in again.");
        return;
      }
      setErr(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8" data-testid="menu-tab">
      <p className="text-ivory/50 text-sm max-w-2xl leading-relaxed">
        Control the site navigation: reorder, hide or add menu items, switch whole pages on or off,
        and show or hide the gold Register button.
      </p>

      <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8" data-testid="menu-pages-card">
        <div className="flex items-center gap-2.5 mb-6">
          <PanelTop size={15} className="text-gold" />
          <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold/80">Pages &amp; button</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {PAGES.map((p) => (
            <Toggle
              key={p.key}
              label={p.label}
              desc={p.desc}
              testid={`menu-page-${p.key}`}
              checked={form.pages[p.key] !== false}
              onChange={(v) => setForm((f) => ({ ...f, pages: { ...f.pages, [p.key]: v } }))}
            />
          ))}
          <Toggle
            label="Register button"
            desc="The gold Register button in the navbar"
            testid="menu-register-cta"
            checked={form.show_register_cta}
            onChange={(v) => setForm((f) => ({ ...f, show_register_cta: v }))}
          />
        </div>
        <p className="text-[0.62rem] text-ivory/40 mt-4 leading-relaxed">
          A switched-off page disappears from the menu, and anyone opening its link sees a friendly
          "currently unavailable" screen. Home and Admin pages always stay on.
        </p>
      </div>

      <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8" data-testid="menu-items-card">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold/80">Menu items (in order)</p>
          <button
            onClick={addItem}
            data-testid="menu-add-item"
            className="text-[0.62rem] tracking-[0.2em] uppercase text-gold inline-flex items-center gap-1.5 hover:text-ivory transition-colors"
          >
            <Plus size={14} /> Add item
          </button>
        </div>

        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <div
              key={item.id}
              className="border border-gold/10 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              data-testid={`menu-item-row-${idx}`}
            >
              <label className="flex items-center gap-2 cursor-pointer shrink-0" title="Show / hide this item">
                <input
                  type="checkbox"
                  checked={item.enabled !== false}
                  onChange={(e) => setItem(idx, "enabled", e.target.checked)}
                  data-testid={`menu-item-enabled-${idx}`}
                  className="w-4 h-4 accent-[#CFA858]"
                />
                <span className="text-[0.58rem] tracking-[0.18em] uppercase text-ivory/40">Show</span>
              </label>
              <label className="flex-1 min-w-[150px]">
                <span className="field-label">Name</span>
                <input
                  className="field"
                  value={item.label || ""}
                  onChange={(e) => setItem(idx, "label", e.target.value)}
                  placeholder="e.g. Notices"
                  maxLength={40}
                  data-testid={`menu-item-label-${idx}`}
                />
              </label>
              <label className="flex-1 min-w-[180px]">
                <span className="field-label">Link</span>
                <input
                  className="field"
                  value={item.url || ""}
                  onChange={(e) => setItem(idx, "url", e.target.value)}
                  placeholder="/notices · /#gallery · https://instagram.com/…"
                  maxLength={300}
                  data-testid={`menu-item-url-${idx}`}
                />
              </label>
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  data-testid={`menu-item-up-${idx}`}
                  aria-label="Move up"
                  className="p-2 text-ivory/40 hover:text-gold transition-colors disabled:opacity-25"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === form.items.length - 1}
                  data-testid={`menu-item-down-${idx}`}
                  aria-label="Move down"
                  className="p-2 text-ivory/40 hover:text-gold transition-colors disabled:opacity-25"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  onClick={() => removeItem(idx)}
                  data-testid={`menu-item-delete-${idx}`}
                  aria-label="Remove menu item"
                  className="p-2 text-ivory/40 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {form.items.length === 0 && (
            <p className="text-ivory/40 text-sm py-6 text-center border border-dashed border-gold/20 rounded-lg">
              No menu items. Click "Add item" to build the navigation.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 flex-wrap mt-8">
          <button
            onClick={save}
            disabled={busy}
            data-testid="menu-save"
            className="btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2.5"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving
              </>
            ) : (
              "Save menu & pages"
            )}
          </button>
          <button
            onClick={reset}
            data-testid="menu-reset"
            className="inline-flex items-center gap-2 text-[0.62rem] tracking-[0.2em] uppercase text-ivory/50 hover:text-gold transition-colors"
          >
            <RotateCcw size={12} /> Reset to defaults
          </button>
        </div>

        {msg && (
          <p className="text-xs text-gold mt-6" data-testid="menu-save-msg">
            {msg}
          </p>
        )}
        {err && (
          <p className="text-xs text-red-300 mt-2" data-testid="menu-save-error">
            {err}
          </p>
        )}
      </div>
    </div>
  );
}

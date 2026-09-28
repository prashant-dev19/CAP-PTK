import { useEffect, useState } from "react";
import { LogOut, Loader2, Lock, ClipboardList, Inbox, Megaphone, Trash2, Pin, Download, Instagram, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { NoticeModal, padNo } from "@/components/NoticesList";
import ApprovalsTab from "@/components/admin/ApprovalsTab";
import UsersTab from "@/components/admin/UsersTab";
import { api, formatApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

function LoginCard({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      onSuccess(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#081711] font-body" data-testid="admin-login-page">
      <form
        onSubmit={submit}
        data-testid="admin-login-form"
        className="w-full max-w-md border border-gold/15 bg-pavilion-mid/60 rounded-2xl p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <LogoMark className="h-11 w-11" />
          <div>
            <p className="font-display text-2xl text-ivory">CAP Administration</p>
            <p className="text-[0.58rem] tracking-[0.3em] uppercase text-gold/70 mt-0.5">
              Cricket Association Pathankot
            </p>
          </div>
        </div>

        <label className="block mb-6">
          <span className="field-label">Email</span>
          <input
            type="email"
            required
            className="field"
            data-testid="admin-login-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin email"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="field-label">Password</span>
          <input
            type="password"
            required
            className="field"
            data-testid="admin-login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="text-sm text-red-300 mt-4" data-testid="admin-login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          data-testid="admin-login-submit"
          className="mt-8 w-full btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold py-4 rounded-full disabled:opacity-60 inline-flex items-center justify-center gap-3"
        >
          {busy ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Signing in
            </>
          ) : (
            <>
              <Lock size={14} /> Sign in
            </>
          )}
        </button>

        <a
          href="/"
          className="block text-center mt-6 text-[0.62rem] tracking-[0.2em] uppercase text-ivory/40 hover:text-gold transition-colors"
          data-testid="admin-back-site"
        >
          Back to site
        </a>
      </form>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, testid }) {
  return (
    <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6" data-testid={testid}>
      <div className="flex items-center gap-3 text-gold/70">
        <Icon size={16} />
        <span className="text-[0.6rem] tracking-[0.25em] uppercase">{label}</span>
      </div>
      <p className="font-display text-4xl text-ivory mt-4">{value}</p>
    </div>
  );
}

function SectionCard({ title, children, testid }) {
  return (
    <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8" data-testid={testid}>
      <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold/80 mb-6">{title}</p>
      {children}
    </div>
  );
}

function HomeContentEditor() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/content")
      .then(({ data }) =>
        setForm({
          ...data,
          process_steps: (data?.process_steps || []).map((s) => ({ ...s })),
          bearers: (data?.bearers || []).map((b) => ({ ...b })),
          gallery_urls: [...(data?.gallery_urls || [])],
          about_points: [...(data?.about_points || [])],
        })
      )
      .catch(() => setErr("Could not load content. Reload the page."));
  }, []);

  if (!form) {
    return (
      <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
        <Loader2 size={18} className="animate-spin text-gold" /> Loading homepage content…
      </div>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setList = (k, i, value) =>
    setForm({ ...form, [k]: form[k].map((v, idx) => (idx === i ? value : v)) });
  const setStep = (i, key, value) =>
    setForm({ ...form, process_steps: form.process_steps.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)) });
  const setBearer = (i, value) =>
    setForm({ ...form, bearers: form.bearers.map((b, idx) => (idx === i ? { ...b, name: value } : b)) });

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api.put("/admin/content", form);
      setMsg("Homepage updated — the live site now shows these texts and images.");
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

  const tf = (label, key, placeholder, textarea = false, testid) => (
    <label className="block">
      <span className="field-label">{label}</span>
      {textarea ? (
        <textarea rows={3} className="field resize-none" data-testid={testid} value={form[key]} onChange={set(key)} placeholder={placeholder} />
      ) : (
        <input className="field" data-testid={testid} value={form[key]} onChange={set(key)} placeholder={placeholder} />
      )}
    </label>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <p className="text-ivory/50 text-sm leading-relaxed">
        Edit the texts and images of the home page here and save — the live site updates instantly.
      </p>

      <SectionCard title="Hero" testid="cms-hero">
        <div className="space-y-6">
          {tf("Headline — line 1", "hero_line1", "The Home of", false, "cms-hero-line1")}
          <div className="grid sm:grid-cols-2 gap-6">
            {tf("Headline — line 2 (gold italic part)", "hero_line2_gold", "Pathankot", false, "cms-hero-line2-gold")}
            {tf("Headline — line 2 (rest)", "hero_line2_rest", "Cricket", false, "cms-hero-line2-rest")}
          </div>
          {tf("Sub-line", "hero_subline", "Short description under the headline", true, "cms-hero-subline")}
          {tf("Background image URL", "hero_image", "https:// …", false, "cms-hero-image")}
        </div>
      </SectionCard>

      <SectionCard title="Trials strip" testid="cms-trials">
        <div className="space-y-6">
          {tf("Label", "trials_label", "District Trials · All Age Groups", false, "cms-trials-label")}
          {tf("Heading", "trials_heading", "Open trials for U-14 to Seniors…", false, "cms-trials-heading")}
          {tf("Dates text", "trials_dates", "To be Announced Soon", false, "cms-trials-dates")}
        </div>
      </SectionCard>

      <SectionCard title="The Association (about)" testid="cms-about">
        <div className="space-y-6">
          {tf("Heading", "about_heading", "", false, "cms-about-heading")}
          {tf("Paragraph 1", "about_p1", "", true, "cms-about-p1")}
          {tf("Paragraph 2", "about_p2", "", true, "cms-about-p2")}
          {tf("Image URL", "about_image", "https:// …", false, "cms-about-image")}
          <div>
            <span className="field-label">Checklist points</span>
            <div className="space-y-3">
              {form.about_points.map((p, i) => (
                <input key={i} className="field" data-testid={`cms-about-point-${i}`} value={p} onChange={(e) => setList("about_points", i, e.target.value)} />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Squads section" testid="cms-teams">
        <div className="space-y-6">
          {tf("Heading", "teams_heading", "Nine squads. Two wings.", false, "cms-teams-heading")}
          {tf("Heading accent (gold italic)", "teams_accent", "One district.", false, "cms-teams-accent")}
          {tf("Sub-text", "teams_sub", "", true, "cms-teams-sub")}
        </div>
      </SectionCard>

      <SectionCard title="The Pathway" testid="cms-process">
        <div className="space-y-6">
          {tf("Heading", "process_heading", "", false, "cms-process-heading")}
          {form.process_steps.map((s, i) => (
            <div key={i} className="border-t border-gold/10 pt-5">
              <span className="field-label">Step 0{i + 1}</span>
              <input className="field" data-testid={`cms-step-title-${i}`} value={s.title} onChange={(e) => setStep(i, "title", e.target.value)} placeholder="Step title" />
              <textarea rows={2} className="field resize-none mt-3" data-testid={`cms-step-desc-${i}`} value={s.desc} onChange={(e) => setStep(i, "desc", e.target.value)} placeholder="Step description" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Gallery" testid="cms-gallery">
        <div className="space-y-6">
          {tf("Heading", "gallery_heading", "", false, "cms-gallery-heading")}
          <div>
            <span className="field-label">Image URLs (leave blank to remove a photo)</span>
            <div className="space-y-3">
              {form.gallery_urls.map((u, i) => (
                <input key={i} className="field" data-testid={`cms-gallery-url-${i}`} value={u} onChange={(e) => setList("gallery_urls", i, e.target.value)} placeholder={`Image ${i + 1} URL`} />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Contact details" testid="cms-contact">
        <div className="space-y-6">
          {tf("Office address", "contact_address", "", false, "cms-contact-address")}
          {tf("Phone", "contact_phone", "", false, "cms-contact-phone")}
          {tf("Email", "contact_email", "", false, "cms-contact-email")}
        </div>
      </SectionCard>

      <SectionCard title="Footer — office bearers & tagline" testid="cms-footer">
        <div className="space-y-6">
          {tf("Tagline", "footer_tagline", "", true, "cms-footer-tagline")}
          <div>
            <span className="field-label">Office bearers</span>
            <div className="space-y-3">
              {form.bearers.map((b, i) => (
                <div key={b.role} className="flex items-end gap-3">
                  <span className="text-xs text-ivory/50 w-36 pb-3 shrink-0">{b.role}</span>
                  <input className="field" data-testid={`cms-bearer-${i}`} value={b.name} onChange={(e) => setBearer(i, e.target.value)} placeholder="Name" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {msg && (
        <p className="text-sm text-gold" data-testid="cms-save-msg">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm text-red-300" data-testid="cms-save-error">
          {err}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        data-testid="cms-save"
        className="btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-10 py-4 rounded-full inline-flex items-center gap-3 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : null} Save homepage
      </button>
    </div>
  );
}

function PopupEditor() {
  const [form, setForm] = useState({ enabled: false, title: "", message: "", image_url: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get("/popup")
      .then(({ data }) =>
        setForm({
          enabled: !!data?.enabled,
          title: data?.title || "",
          message: data?.message || "",
          image_url: data?.image_url || "",
        })
      )
      .catch(() => {});
  }, []);

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const { data } = await api.put("/admin/popup", form);
      if (data?.pending) {
        setMsg("Submitted — an admin must approve it before it goes live.");
      } else {
        setForm({
          enabled: !!data.enabled,
          title: data.title || "",
          message: data.message || "",
          image_url: data.image_url || "",
        });
        setMsg(
          data.enabled
            ? "Pop-up is live on the home page — visitors will see it once per session."
            : "Pop-up is turned off."
        );
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
    <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8" data-testid="popup-editor">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-display text-2xl text-ivory">Home pop-up</p>
          <p className="text-[0.6rem] tracking-[0.22em] uppercase text-ivory/40 mt-1">
            Shown once per visitor session · homepage only
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none" data-testid="popup-enable-label">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            data-testid="popup-enable-checkbox"
            className="w-4 h-4 accent-[#CFA858]"
          />
          <span className="text-[0.62rem] tracking-[0.22em] uppercase text-gold font-semibold">Show pop-up</span>
        </label>
      </div>

      <div className="mt-8 space-y-6">
        <label className="block">
          <span className="field-label">Title</span>
          <input
            className="field"
            data-testid="popup-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. District trials — important notice"
            maxLength={120}
          />
        </label>
        <label className="block">
          <span className="field-label">Message</span>
          <textarea
            rows={4}
            className="field resize-none"
            data-testid="popup-message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="The message visitors will see in the pop-up (optional if you use an image)"
            maxLength={2000}
          />
        </label>
        <label className="block">
          <span className="field-label">Image URL</span>
          <input
            className="field"
            data-testid="popup-image-url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https:// … link to a poster or image (optional)"
            maxLength={600}
          />
        </label>
      </div>

      {msg && (
        <p className="text-xs text-gold mt-6" data-testid="popup-save-msg">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-xs text-red-300 mt-2" data-testid="popup-save-error">
          {err}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        data-testid="popup-save"
        className="mt-8 btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : null} Save pop-up
      </button>
    </div>
  );
}

function SquadEditor({ squad, onSaved }) {
  const sid = squad.age_group.toLowerCase().replace("-", "");
  const [photo, setPhoto] = useState(squad.group_photo || "");
  const [players, setPlayers] = useState(squad.players || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const setPlayer = (idx, key, value) =>
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: value } : p)));

  const addPlayer = () =>
    setPlayers((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: "",
        role: "",
        batting_style: "",
        bowling_style: "",
        jersey_number: null,
      },
    ]);

  const removePlayer = (idx) => setPlayers((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const clean = players
        .map((p) => ({ ...p, name: (p.name || "").trim() }))
        .filter((p) => p.name.length >= 2)
        .map((p) => ({
          ...p,
          jersey_number: p.jersey_number === "" || p.jersey_number == null ? null : Number(p.jersey_number),
        }));
      const { data } = await api.put(`/admin/squads/${squad.id}`, { group_photo: photo, players: clean });
      if (data?.pending) {
        onSaved(null);
        setMsg("Submitted — an admin must approve it before it goes live.");
      } else {
        onSaved(data);
        setMsg(`Saved — ${clean.length} player${clean.length === 1 ? "" : "s"} in the ${data.age_group} squad.`);
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
    <div
      className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8"
      data-testid={`squad-editor-${sid}`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="font-display text-2xl text-ivory">
          {squad.age_group} <span className="text-ivory/40 text-base">· {squad.label}</span>
        </p>
        <button
          onClick={save}
          disabled={busy}
          data-testid={`squad-save-${sid}`}
          className="btn-gold bg-gold text-pavilion text-[0.62rem] tracking-[0.2em] uppercase font-semibold px-6 py-2.5 rounded-full inline-flex items-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : null} Save squad
        </button>
      </div>

      <label className="block mt-6">
        <span className="field-label">Group photo URL</span>
        <input
          className="field"
          data-testid={`squad-photo-${sid}`}
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder="https:// … link to the squad's group photograph"
        />
      </label>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/80">Players ({players.length})</p>
          <button
            onClick={addPlayer}
            data-testid={`squad-add-player-${sid}`}
            className="text-[0.62rem] tracking-[0.2em] uppercase text-gold inline-flex items-center gap-1.5 hover:text-ivory transition-colors"
          >
            <Plus size={14} /> Add player
          </button>
        </div>

        {players.length === 0 ? (
          <p className="text-ivory/40 text-sm py-6 text-center border border-dashed border-gold/20 rounded-lg">
            No players added yet. Click "Add player" to build the squad.
          </p>
        ) : (
          <div className="space-y-4">
            {players.map((p, idx) => (
              <div key={p.id} className="flex flex-wrap items-end gap-3" data-testid="squad-player-row">
                <label className="flex-1 min-w-[160px]">
                  <span className="field-label">Name</span>
                  <input
                    className="field"
                    value={p.name}
                    onChange={(e) => setPlayer(idx, "name", e.target.value)}
                    placeholder="Player name"
                  />
                </label>
                <label className="w-32">
                  <span className="field-label">Role</span>
                  <select className="field" value={p.role} onChange={(e) => setPlayer(idx, "role", e.target.value)}>
                    <option value="">—</option>
                    <option>Batsman</option>
                    <option>Bowler</option>
                    <option>All-Rounder</option>
                    <option>Wicket-Keeper</option>
                  </select>
                </label>
                <label className="w-36">
                  <span className="field-label">Batting</span>
                  <select className="field" value={p.batting_style} onChange={(e) => setPlayer(idx, "batting_style", e.target.value)}>
                    <option value="">—</option>
                    <option>Right-hand bat</option>
                    <option>Left-hand bat</option>
                  </select>
                </label>
                <label className="w-36">
                  <span className="field-label">Bowling</span>
                  <select className="field" value={p.bowling_style} onChange={(e) => setPlayer(idx, "bowling_style", e.target.value)}>
                    <option value="">—</option>
                    <option>Right-arm fast</option>
                    <option>Right-arm medium</option>
                    <option>Left-arm fast</option>
                    <option>Left-arm medium</option>
                    <option>Off-spin</option>
                    <option>Leg-spin</option>
                  </select>
                </label>
                <label className="w-14">
                  <span className="field-label">No.</span>
                  <input
                    type="number"
                    min="0"
                    className="field"
                    value={p.jersey_number ?? ""}
                    onChange={(e) => setPlayer(idx, "jersey_number", e.target.value)}
                  />
                </label>
                <button
                  onClick={() => removePlayer(idx)}
                  aria-label="Remove player"
                  className="text-ivory/40 hover:text-red-300 transition-colors p-2 pb-3"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && (
        <p className="text-xs text-gold mt-5" data-testid="squad-save-msg">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-xs text-red-300 mt-2" data-testid="squad-save-error">
          {err}
        </p>
      )}
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("registrations");
  const [regs, setRegs] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [anns, setAnns] = useState(null);
  const [squads, setSquads] = useState(null);
  const [error, setError] = useState("");
  const [annForm, setAnnForm] = useState({ title: "", body: "", link_url: "" });
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState("");
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [info, setInfo] = useState("");

  const load = async () => {
    setError("");
    try {
      const [r, m, a, sq] = await Promise.all([
        api.get("/admin/registrations"),
        api.get("/admin/messages"),
        api.get("/admin/announcements").catch(() => []),
        api.get("/squads").catch(() => []),
      ]);
      setRegs(r.data);
      setMsgs(m.data);
      setAnns(Array.isArray(a.data) ? a.data : []);
      setSquads(Array.isArray(sq.data) ? sq.data : []);
    } catch (e) {
      if (e?.response?.status === 401) {
        onLogout();
        return;
      }
      setError(formatApiError(e));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postAnnouncement = async (e) => {
    e.preventDefault();
    setAnnBusy(true);
    setAnnError("");
    try {
      const { data: created } = await api.post("/admin/announcements", annForm);
      setAnnForm({ title: "", body: "" });
      if (created?.pending) {
        setInfo("Submitted — an admin must approve it before it appears on the site.");
      } else {
        const { data } = await api.get("/admin/announcements");
        setAnns(data);
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        onLogout();
        return;
      }
      setAnnError(formatApiError(err));
    } finally {
      setAnnBusy(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const res = await api.delete(`/admin/announcements/${id}`);
      if (res.status === 200 && res.data?.pending) {
        setInfo("Delete submitted for admin approval.");
      } else {
        setAnns((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const togglePin = async (id) => {
    try {
      const { data } = await api.post(`/admin/announcements/${id}/pin`);
      if (data?.pending) {
        setInfo("Pin change submitted for admin approval.");
      } else {
        setAnns((prev) => prev.map((a) => (a.id === id ? data : a)));
      }
    } catch (e) {
      if (e?.response?.status === 401) {
        onLogout();
        return;
      }
      setError(formatApiError(e));
    }
  };

  const loading = regs === null || msgs === null || anns === null;

  return (
    <div className="min-h-screen bg-[#081711] text-ivory font-body" data-testid="admin-dashboard">
      <header className="border-b border-gold/15 bg-pavilion-deep/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-lg tracking-[0.15em]">CAP · Administration</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-xs text-ivory/50" data-testid="admin-user-email">
              {user?.email}
            </span>
            <span
              data-testid="admin-role-badge"
              className="text-[0.55rem] tracking-[0.2em] uppercase border border-gold/40 text-gold rounded-full px-2.5 py-1"
            >
              {user?.role === "admin" ? "Admin" : "Editor"}
            </span>
            <button
              onClick={onLogout}
              data-testid="admin-logout"
              className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-ivory/60 hover:text-gold transition-colors"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <StatCard icon={ClipboardList} label="Player Registrations" value={loading ? "—" : regs.length} testid="stat-registrations" />
          <StatCard icon={Inbox} label="Contact Messages" value={loading ? "—" : msgs.length} testid="stat-messages" />
          <StatCard icon={Megaphone} label="Announcements" value={loading ? "—" : anns.length} testid="stat-announcements" />
        </div>

        <div className="flex items-center justify-between gap-6 border-b border-gold/15 mb-8">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "registrations", label: "Registrations" },
              { id: "messages", label: "Messages" },
              { id: "announcements", label: "Announcements" },
              { id: "squads", label: "Squads" },
              { id: "popup", label: "Pop-up" },
              { id: "homepage", label: "Homepage" },
              ...(user?.role === "admin"
                ? [
                    { id: "approvals", label: "Approvals" },
                    { id: "users", label: "Users" },
                  ]
                : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                data-testid={`admin-tab-${t.id}`}
                className={`pb-3 text-xs tracking-[0.22em] uppercase transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  tab === t.id ? "text-gold border-gold" : "text-ivory/50 border-transparent hover:text-ivory"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "registrations" && regs !== null && regs.length > 0 && (
            <a
              href={`${process.env.REACT_APP_BACKEND_URL}/api/admin/registrations/export`}
              data-testid="export-csv-button"
              className="hidden sm:inline-flex items-center gap-2 pb-3 text-xs tracking-[0.22em] uppercase text-ivory/60 hover:text-gold transition-colors whitespace-nowrap"
            >
              <Download size={14} /> Download CSV
            </a>
          )}
        </div>

        {error && <p className="text-sm text-red-300 mb-6" data-testid="admin-error">{error}</p>}
        {info && <p className="text-sm text-gold mb-6" data-testid="admin-info">{info}</p>}

        {loading ? (
          <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading…
          </div>
        ) : tab === "registrations" ? (
          regs.length === 0 ? (
            <p className="text-ivory/40 text-sm py-16 text-center" data-testid="registrations-empty">
              No player registrations yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-gold/15 rounded-xl bg-pavilion-mid/40">
              <table className="w-full text-sm" data-testid="registrations-table">
                <thead>
                  <tr className="text-left text-[0.58rem] tracking-[0.2em] uppercase text-gold/70 border-b border-gold/15">
                    {["Name", "Age Grp", "Role", "Bat / Bowl", "DOB", "Phone", "Email", "Residence", "Registered"].map((h) => (
                      <th key={h} className="px-4 py-3 whitespace-nowrap font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regs.map((r) => (
                    <tr key={r.id} data-testid={`registration-row-${r.id}`} className="border-b border-ivory/5 hover:bg-gold/5">
                      <td className="px-4 py-3 whitespace-nowrap text-ivory font-medium">{r.full_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[0.6rem] tracking-widest uppercase text-gold border border-gold/30 rounded-full px-2.5 py-1">
                          {r.age_group}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/70">{r.playing_role}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/50 text-xs">
                        {(r.batting_style || "—") + " / " + (r.bowling_style || "—")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/50 text-xs">{r.date_of_birth}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/70">{r.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/70">{r.email}</td>
                      <td className="px-4 py-3 text-ivory/50 text-xs max-w-[180px] truncate">{r.residence}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ivory/50 text-xs">{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === "squads" ? (
          squads === null ? (
            <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
              <Loader2 size={18} className="animate-spin" /> Loading squads…
            </div>
          ) : (
            <div className="space-y-10" data-testid="squads-admin-list">
              <p className="text-ivory/50 text-sm max-w-2xl leading-relaxed">
                Keep each squad current: paste the group photograph link, add every selected player
                with their details, and save. The public squads page updates instantly.
              </p>
              {[
                { wing: "Men", title: "Men's Wing" },
                { wing: "Women", title: "Women's Wing" },
              ].map(({ wing, title }) => {
                const list = squads.filter((s) => (s.wing || "Men") === wing);
                if (!list.length) return null;
                return (
                  <div key={wing} className="space-y-6">
                    <p className="font-display text-3xl text-gold italic">{title}</p>
                    {list.map((s) => (
                      <SquadEditor
                        key={s.id}
                        squad={s}
                        onSaved={(u) => u && setSquads((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )
        ) : tab === "announcements" ? (
          <div className="grid lg:grid-cols-12 gap-8">
            <form
              onSubmit={postAnnouncement}
              data-testid="announcement-form"
              className="lg:col-span-5 border border-gold/15 bg-pavilion-mid/40 rounded-xl p-8 self-start"
            >
              <p className="text-[0.62rem] tracking-[0.25em] uppercase text-gold/80 mb-6">Post a notice</p>
              <label className="block mb-6">
                <span className="field-label">Title *</span>
                <input
                  className="field"
                  required
                  data-testid="announcement-title"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="e.g. District trials — U-16"
                  maxLength={160}
                />
              </label>
              <label className="block">
                <span className="field-label">Notice *</span>
                <textarea
                  rows={6}
                  className="field resize-none"
                  required
                  data-testid="announcement-body"
                  value={annForm.body}
                  onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
                  placeholder="Details players and parents should know"
                  maxLength={4000}
                />
              </label>

              <label className="block">
                <span className="field-label">Link (optional)</span>
                <input
                  className="field"
                  data-testid="announcement-link"
                  value={annForm.link_url}
                  onChange={(e) => setAnnForm({ ...annForm, link_url: e.target.value })}
                  placeholder="https:// … becomes a clickable link with the notice"
                  maxLength={600}
                />
              </label>

              {annError && (
                <p className="text-sm text-red-300 mt-4" data-testid="announcement-error">
                  {annError}
                </p>
              )}
              <button
                type="submit"
                disabled={annBusy}
                data-testid="announcement-submit"
                className="mt-8 w-full btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold py-4 rounded-full disabled:opacity-60 inline-flex items-center justify-center gap-3"
              >
                {annBusy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Posting
                  </>
                ) : (
                  <>
                    <Megaphone size={14} /> Post announcement
                  </>
                )}
              </button>
            </form>

            <div className="lg:col-span-7" data-testid="announcements-admin-list">
              {anns.length === 0 ? (
                <p className="text-ivory/40 text-sm py-16 text-center" data-testid="announcements-empty">
                  No announcements posted yet.
                </p>
              ) : (
                <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[60px_1fr_190px] gap-4 px-5 py-4 border-b border-gold/15 text-[0.58rem] tracking-[0.25em] uppercase text-gold/70">
                    <span>No.</span>
                    <span>Notice</span>
                    <span className="text-right">Actions</span>
                  </div>
                  {anns.map((a) => (
                    <div
                      key={a.id}
                      data-testid={`announcement-item-${a.id}`}
                      className="flex flex-col sm:grid sm:grid-cols-[60px_1fr_190px] gap-3 sm:gap-4 px-5 py-4 border-b border-gold/10 last:border-0 items-start sm:items-center hover:bg-gold/5 transition-colors"
                    >
                      <span className="font-display text-lg text-gold/80" data-testid={`admin-notice-number-${a.id}`}>
                        {padNo(a.notice_no)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-lg text-ivory leading-snug flex items-center gap-2 flex-wrap">
                          {a.title}
                          {a.pinned && <Pin size={11} className="text-gold shrink-0" />}
                        </p>
                        <p className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/40 mt-1">
                          {fmtDate(a.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 justify-self-start sm:justify-self-end">
                        <button
                          onClick={() => setSelectedAnn(a)}
                          data-testid={`admin-notice-view-${a.id}`}
                          aria-label="View notice detail"
                          title="View detail"
                          className="inline-flex items-center gap-1.5 text-[0.56rem] tracking-[0.16em] uppercase border border-gold/40 text-gold rounded-full px-3 py-2 hover:bg-gold hover:text-pavilion transition-colors"
                        >
                          View detail
                        </button>
                        <button
                          onClick={() => togglePin(a.id)}
                          data-testid={`announcement-pin-${a.id}`}
                          aria-label={a.pinned ? "Unpin announcement" : "Pin announcement"}
                          title={a.pinned ? "Unpin — remove from top of the board" : "Pin to top of the board"}
                          className={`p-2 transition-colors ${a.pinned ? "text-gold" : "text-ivory/40 hover:text-gold"}`}
                        >
                          <Pin size={15} fill={a.pinned ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          data-testid={`announcement-delete-${a.id}`}
                          aria-label="Delete announcement"
                          className="text-ivory/40 hover:text-red-300 transition-colors p-2"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <NoticeModal notice={selectedAnn} onClose={() => setSelectedAnn(null)} />
            </div>
          </div>
        ) : tab === "popup" ? (
          <div className="max-w-2xl">
            <PopupEditor />
          </div>
        ) : tab === "homepage" ? (
          <HomeContentEditor />
        ) : tab === "approvals" ? (
          <ApprovalsTab onChanged={load} />
        ) : tab === "users" ? (
          <UsersTab currentUser={user} />
        ) : msgs.length === 0 ? (
          <p className="text-ivory/40 text-sm py-16 text-center" data-testid="messages-empty">
            No contact messages yet.
          </p>
        ) : (
          <div className="overflow-x-auto border border-gold/15 rounded-xl bg-pavilion-mid/40">
            <table className="w-full text-sm" data-testid="messages-table">
              <thead>
                <tr className="text-left text-[0.58rem] tracking-[0.2em] uppercase text-gold/70 border-b border-gold/15">
                  {["Name", "Email", "Phone", "Subject", "Message", "Received"].map((h) => (
                    <th key={h} className="px-4 py-3 whitespace-nowrap font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {msgs.map((m) => (
                  <tr key={m.id} data-testid={`message-row-${m.id}`} className="border-b border-ivory/5 hover:bg-gold/5 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-ivory font-medium">{m.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ivory/70">{m.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ivory/70">{m.phone || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[0.6rem] tracking-widest uppercase text-gold border border-gold/30 rounded-full px-2.5 py-1">
                        {m.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ivory/60 text-xs max-w-[320px]">{m.message}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ivory/50 text-xs">{fmtDate(m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#081711] text-ivory/60 font-body" data-testid="admin-checking">
        <Loader2 size={22} className="animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return <LoginCard onSuccess={setUser} />;
  return <Dashboard user={user} onLogout={logout} />;
}

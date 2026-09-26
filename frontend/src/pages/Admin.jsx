import { useEffect, useState } from "react";
import { LogOut, Loader2, Lock, ClipboardList, Inbox, Megaphone, Trash2, Pin, Download, Instagram, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
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
      onSaved(data);
      setMsg(`Saved — ${clean.length} player${clean.length === 1 ? "" : "s"} in the ${data.age_group} squad.`);
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
  const [annForm, setAnnForm] = useState({ title: "", body: "" });
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState("");

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
      await api.post("/admin/announcements", annForm);
      setAnnForm({ title: "", body: "" });
      const { data } = await api.get("/admin/announcements");
      setAnns(data);
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
      await api.delete(`/admin/announcements/${id}`);
      setAnns((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const togglePin = async (id) => {
    try {
      const { data } = await api.post(`/admin/announcements/${id}/pin`);
      setAnns((prev) => prev.map((a) => (a.id === id ? data : a)));
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
                        onSaved={(u) => setSquads((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
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

            <div className="lg:col-span-7 space-y-4" data-testid="announcements-admin-list">
              {anns.length === 0 ? (
                <p className="text-ivory/40 text-sm py-16 text-center" data-testid="announcements-empty">
                  No announcements posted yet.
                </p>
              ) : (
                anns.map((a) => (
                  <div
                    key={a.id}
                    className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 flex items-start justify-between gap-4"
                    data-testid={`announcement-item-${a.id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/60">{fmtDate(a.created_at)}</p>
                      <p className="font-display text-xl text-ivory mt-1">{a.title}</p>
                      <p className="text-sm text-ivory/60 mt-2 whitespace-pre-line">{a.body}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-[0.55rem] tracking-[0.25em] uppercase text-ivory/40">Share</span>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `${a.title} — Cricket Association Pathankot\n${window.location.origin}/#announcements`
                          )}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          data-testid={`admin-share-whatsapp-${a.id}`}
                          aria-label="Share this notice on WhatsApp"
                          title="Share on WhatsApp"
                          className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors"
                        >
                          <WhatsAppIcon size={12} />
                        </a>
                        <a
                          href="https://www.instagram.com/cappathankot/"
                          target="_blank"
                          rel="noreferrer noopener"
                          data-testid={`admin-share-instagram-${a.id}`}
                          aria-label="Share via our Instagram"
                          title="Open our Instagram to share"
                          className="w-7 h-7 rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors"
                        >
                          <Instagram size={12} />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => togglePin(a.id)}
                        data-testid={`announcement-pin-${a.id}`}
                        aria-label={a.pinned ? "Unpin announcement" : "Pin announcement"}
                        title={a.pinned ? "Unpin — remove from top of the board" : "Pin to top of the board"}
                        className={`p-1 transition-colors ${a.pinned ? "text-gold" : "text-ivory/40 hover:text-gold"}`}
                      >
                        <Pin size={16} fill={a.pinned ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(a.id)}
                        data-testid={`announcement-delete-${a.id}`}
                        aria-label="Delete announcement"
                        className="text-ivory/40 hover:text-red-300 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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

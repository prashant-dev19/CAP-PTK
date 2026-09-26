import { useEffect, useState } from "react";
import { LogOut, Loader2, Lock, ClipboardList, Inbox, Megaphone, Trash2, Pin, Download, Instagram } from "lucide-react";
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

function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("registrations");
  const [regs, setRegs] = useState(null);
  const [msgs, setMsgs] = useState(null);
  const [anns, setAnns] = useState(null);
  const [error, setError] = useState("");
  const [annForm, setAnnForm] = useState({ title: "", body: "" });
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [r, m, a] = await Promise.all([
        api.get("/admin/registrations"),
        api.get("/admin/messages"),
        api.get("/admin/announcements").catch(() => []),
      ]);
      setRegs(r.data);
      setMsgs(m.data);
      setAnns(Array.isArray(a.data) ? a.data : []);
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

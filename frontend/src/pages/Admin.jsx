import { useEffect, useState } from "react";
import { LogOut, Loader2, Lock, ClipboardList, Inbox } from "lucide-react";
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
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [r, m] = await Promise.all([api.get("/admin/registrations"), api.get("/admin/messages")]);
      setRegs(r.data);
      setMsgs(m.data);
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

  const loading = regs === null || msgs === null;

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
        <div className="grid grid-cols-2 gap-4 mb-10">
          <StatCard icon={ClipboardList} label="Player Registrations" value={loading ? "—" : regs.length} testid="stat-registrations" />
          <StatCard icon={Inbox} label="Contact Messages" value={loading ? "—" : msgs.length} testid="stat-messages" />
        </div>

        <div className="flex gap-8 border-b border-gold/15 mb-8">
          {[
            { id: "registrations", label: "Registrations" },
            { id: "messages", label: "Messages" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`admin-tab-${t.id}`}
              className={`pb-3 text-xs tracking-[0.22em] uppercase transition-colors border-b-2 -mb-px ${
                tab === t.id ? "text-gold border-gold" : "text-ivory/50 border-transparent hover:text-ivory"
              }`}
            >
              {t.label}
            </button>
          ))}
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

import { useEffect, useState } from "react";
import { History, KeyRound, Loader2, LogOut, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, formatApiError } from "@/lib/api";

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
};

const REASON_LABELS = {
  ok: "Signed in",
  wrong_password: "Wrong password",
  no_such_user: "Unknown email",
  "2fa_code_required": "2FA code asked",
  "2fa_code_invalid": "Wrong 2FA code",
  "2fa_enabled": "2FA turned on",
  "2fa_disabled": "2FA turned off",
  "2fa_disable_bad_password": "Wrong password (2FA off)",
  password_changed: "Password changed",
  logged_out_everywhere: "Logged out everywhere",
};

function Card({ icon: Icon, title, children, testid }) {
  return (
    <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8" data-testid={testid}>
      <div className="flex items-center gap-2.5 mb-6">
        <Icon size={15} className="text-gold" />
        <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold/80">{title}</p>
      </div>
      {children}
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (form.new_password !== form.confirm) {
      setError("The new passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setDone(true);
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={KeyRound} title="Change your password" testid="security-password-card">
      <form onSubmit={submit} data-testid="password-change-form" className="max-w-md space-y-5">
        <label className="block">
          <span className="field-label">Current password</span>
          <input
            type="password"
            required
            className="field"
            data-testid="password-current"
            value={form.current_password}
            onChange={set("current_password")}
            autoComplete="current-password"
          />
        </label>
        <label className="block">
          <span className="field-label">New password</span>
          <input
            type="password"
            required
            minLength={10}
            className="field"
            data-testid="password-new"
            value={form.new_password}
            onChange={set("new_password")}
            autoComplete="new-password"
          />
          <span className="block text-[0.62rem] text-ivory/40 mt-2">
            At least 10 characters, with letters and numbers. Changing it signs out every other device.
          </span>
        </label>
        <label className="block">
          <span className="field-label">Repeat new password</span>
          <input
            type="password"
            required
            className="field"
            data-testid="password-confirm"
            value={form.confirm}
            onChange={set("confirm")}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="text-sm text-red-300" data-testid="password-error">
            {error}
          </p>
        )}
        {done && (
          <p className="text-sm text-gold" data-testid="password-success">
            Password changed — other devices have been signed out.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          data-testid="password-submit"
          className="btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2.5"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving
            </>
          ) : (
            <>
              <KeyRound size={13} /> Update password
            </>
          )}
        </button>
      </form>
    </Card>
  );
}

function TwoFactorCard({ user }) {
  const [enabled, setEnabled] = useState(!!user?.totp_enabled);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  useEffect(() => {
    setEnabled(!!user?.totp_enabled);
  }, [user?.totp_enabled]);

  const startSetup = async () => {
    setBusy(true);
    setError("");
    setDone("");
    try {
      const { data } = await api.post("/auth/2fa/setup");
      setSetup(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const activate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      await api.post("/auth/2fa/activate", { code });
      setEnabled(true);
      setSetup(null);
      setCode("");
      setDone("Two-factor authentication is now on. Keep the app on your phone — you'll need it at every sign-in.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const disable = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      await api.post("/auth/2fa/disable", { password });
      setEnabled(false);
      setPassword("");
      setDone("Two-factor authentication is off.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card icon={Smartphone} title="Two-factor sign-in (authenticator app)" testid="security-2fa-card">
      <div className="flex items-center gap-3 flex-wrap" data-testid="2fa-status">
        <span
          className={`text-[0.55rem] tracking-[0.2em] uppercase rounded-full px-3 py-1 border ${
            enabled ? "text-gold border-gold/50 bg-gold/10" : "text-ivory/50 border-ivory/20"
          }`}
        >
          {enabled ? "Enabled" : "Not enabled"}
        </span>
        <span className="text-xs text-ivory/50 max-w-lg">
          {enabled
            ? "Signing in needs your password plus a 6-digit code from your phone."
            : "Add an extra lock on the panel: scan a QR code once, then every sign-in also needs a code from your phone."}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-300 mt-5" data-testid="2fa-error">
          {error}
        </p>
      )}
      {done && (
        <p className="text-sm text-gold mt-5" data-testid="2fa-info">
          {done}
        </p>
      )}

      {!enabled && !setup && (
        <button
          onClick={startSetup}
          disabled={busy}
          data-testid="2fa-setup-button"
          className="mt-6 btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2.5"
        >
          {busy ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Preparing
            </>
          ) : (
            <>
              <ShieldCheck size={13} /> Set up 2FA
            </>
          )}
        </button>
      )}

      {!enabled && setup && (
        <form onSubmit={activate} data-testid="2fa-activate-form" className="mt-8 flex flex-col sm:flex-row gap-8 items-start">
          <div className="bg-ivory p-3 rounded-xl shrink-0">
            <QRCodeSVG value={setup.otpauth_uri} size={148} data-testid="2fa-qr" />
          </div>
          <div className="max-w-sm">
            <p className="text-sm text-ivory/70 leading-relaxed">
              1. Open Google Authenticator (or any authenticator app) and scan this QR code.
              <br />
              2. Enter the 6-digit code it shows to finish.
            </p>
            <p className="text-[0.62rem] text-ivory/40 mt-3 break-all">
              Can't scan? Key: <span className="text-gold/70">{setup.secret}</span>
            </p>
            <label className="block mt-5">
              <span className="field-label">6-digit code</span>
              <input
                className="field tracking-[0.4em] text-center text-xl"
                required
                inputMode="numeric"
                data-testid="2fa-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={7}
                autoComplete="one-time-code"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              data-testid="2fa-activate-button"
              className="mt-5 btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full disabled:opacity-60 inline-flex items-center gap-2.5"
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Verifying
                </>
              ) : (
                <>
                  <ShieldCheck size={13} /> Turn on 2FA
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {enabled && (
        <form onSubmit={disable} className="mt-6 flex flex-col sm:flex-row gap-3 items-start max-w-lg" data-testid="2fa-disable-form">
          <input
            type="password"
            required
            className="field"
            placeholder="Confirm your password to turn 2FA off"
            data-testid="2fa-disable-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={busy}
            data-testid="2fa-disable-button"
            className="shrink-0 inline-flex items-center gap-2 text-[0.65rem] tracking-[0.22em] uppercase border border-red-300/40 text-red-300 rounded-full px-6 py-3 hover:bg-red-300 hover:text-pavilion transition-colors disabled:opacity-60"
          >
            Turn off
          </button>
        </form>
      )}
    </Card>
  );
}

function ActivityLog() {
  const [events, setEvents] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/admin/login-events");
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card icon={History} title="Recent login activity" testid="security-activity-card">
      <div className="flex items-center justify-between mb-4 gap-4">
        <p className="text-xs text-ivory/50">Every sign-in attempt on the panel — successful or not.</p>
        <button
          onClick={load}
          data-testid="activity-refresh"
          className="text-ivory/50 hover:text-gold transition-colors p-1 shrink-0"
          aria-label="Refresh activity"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        </button>
      </div>
      {events === null ? (
        <div className="flex items-center gap-3 text-ivory/50 text-sm py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : events.length === 0 ? (
        <p className="text-ivory/40 text-sm py-10 text-center" data-testid="activity-empty">
          No sign-in attempts recorded yet.
        </p>
      ) : (
        <div className="border border-gold/10 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto" data-testid="activity-table">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-[92px_1fr_auto] sm:grid-cols-[110px_1fr_170px_110px] gap-3 px-4 py-3 border-b border-gold/5 last:border-0 text-xs items-center"
              data-testid={`activity-row-${ev.id}`}
            >
              <span className="text-ivory/40 text-[0.62rem]">{fmtTime(ev.created_at)}</span>
              <span className="text-ivory/80 truncate">{ev.email || "—"}</span>
              <span
                className={`hidden sm:inline text-[0.6rem] tracking-[0.14em] uppercase ${
                  ev.success ? "text-gold" : "text-red-300/80"
                }`}
              >
                {REASON_LABELS[ev.reason] || (ev.success ? "OK" : "Failed")}
              </span>
              <span className="text-ivory/40 text-[0.62rem] sm:text-right">{ev.ip}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SecurityTab({ user, onLogout }) {
  const [busy, setBusy] = useState(false);

  const logoutEverywhere = async () => {
    if (!window.confirm("Sign out every device and session using this account?")) return;
    setBusy(true);
    try {
      await api.post("/auth/logout-all");
    } catch {
      /* signing out locally regardless */
    }
    onLogout();
  };

  return (
    <div className="space-y-8 max-w-4xl" data-testid="security-tab">
      <p className="text-ivory/50 text-sm max-w-2xl leading-relaxed">
        Keep the panel safe: use a strong password, turn on two-factor sign-in, and check the log now
        and then to see who has been trying to get in.
      </p>
      <PasswordCard />
      <TwoFactorCard user={user} />
      {user?.role === "admin" && <ActivityLog />}
      <Card icon={LogOut} title="Sessions" testid="security-sessions-card">
        <p className="text-xs text-ivory/50 max-w-md leading-relaxed">
          If you think someone else may have your password, sign out everywhere — every phone and
          computer using this account is logged out instantly.
        </p>
        <button
          onClick={logoutEverywhere}
          disabled={busy}
          data-testid="logout-everywhere"
          className="mt-5 inline-flex items-center gap-2.5 text-[0.65rem] tracking-[0.22em] uppercase border border-red-300/40 text-red-300 rounded-full px-6 py-3 hover:bg-red-300 hover:text-pavilion transition-colors disabled:opacity-60"
        >
          <LogOut size={13} /> Log out everywhere
        </button>
      </Card>
    </div>
  );
}

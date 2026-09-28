import { useEffect, useState } from "react";
import { Trash2, Loader2, UserPlus } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import { fmtDate } from "@/components/NoticesList";

export default function UsersTab({ currentUser }) {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", role: "editor" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/admin/users")
      .then(({ data }) => setUsers(data))
      .catch((e) => setError(formatApiError(e)));

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const { data } = await api.post("/admin/users", form);
      setMsg(`User added: ${data.email} (${data.role})`);
      setForm({ email: "", password: "", role: "editor" });
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Remove ${u.email}?`)) return;
    setError("");
    try {
      await api.delete(`/admin/users/${u.id}`);
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8" data-testid="users-tab">
      <form
        onSubmit={add}
        data-testid="user-form"
        className="lg:col-span-5 border border-gold/15 bg-pavilion-mid/40 rounded-xl p-6 md:p-8 self-start"
      >
        <p className="text-[0.62rem] tracking-[0.28em] uppercase text-gold/80 mb-6">Add a user</p>
        <label className="block mb-6">
          <span className="field-label">Email</span>
          <input
            type="email"
            required
            className="field"
            data-testid="user-email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="editor@capathankot.in"
          />
        </label>
        <label className="block mb-6">
          <span className="field-label">Password (min 8 characters)</span>
          <input
            type="password"
            required
            minLength={8}
            className="field"
            data-testid="user-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Set a password"
          />
        </label>
        <label className="block">
          <span className="field-label">Role</span>
          <select
            className="field"
            data-testid="user-role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="editor">Editor — changes need admin approval</option>
            <option value="admin">Admin — full access, publishes directly</option>
          </select>
        </label>

        {msg && <p className="text-xs text-gold mt-5" data-testid="user-form-msg">{msg}</p>}
        {error && <p className="text-xs text-red-300 mt-2" data-testid="user-form-error">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          data-testid="user-submit"
          className="mt-8 w-full btn-gold bg-gold text-pavilion text-[0.62rem] tracking-[0.22em] uppercase font-semibold py-3.5 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={14} />} Add user
        </button>
      </form>

      <div className="lg:col-span-7" data-testid="users-list">
        {users === null ? (
          <div className="flex items-center gap-3 text-ivory/50 text-sm py-16 justify-center">
            <Loader2 size={18} className="animate-spin text-gold" /> Loading users…
          </div>
        ) : (
          <div className="border border-gold/15 bg-pavilion-mid/40 rounded-xl overflow-hidden">
            {users.map((u) => (
              <div
                key={u.id}
                data-testid={`user-row-${u.email.replace(/[^a-z0-9]/gi, "-")}`}
                className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gold/10 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ivory font-medium truncate">{u.email}</p>
                  <p className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/40 mt-1">
                    {u.role} · joined {fmtDate(u.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[0.55rem] tracking-[0.2em] uppercase rounded-full px-2.5 py-1 border ${
                      u.role === "admin"
                        ? "text-gold border-gold/40"
                        : "text-ivory/60 border-ivory/20"
                    }`}
                  >
                    {u.role}
                  </span>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => remove(u)}
                      data-testid={`user-delete-${u.email.replace(/[^a-z0-9]/gi, "-")}`}
                      aria-label={`Remove ${u.email}`}
                      className="text-ivory/40 hover:text-red-300 transition-colors p-1.5"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {error && <p className="text-xs text-red-300 px-5 py-4" data-testid="users-error">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

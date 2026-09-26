import { useState } from "react";
import { ChevronDown, Loader2, Check } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

const EMPTY = {
  full_name: "",
  date_of_birth: "",
  gender: "",
  age_group: "",
  playing_role: "",
  batting_style: "",
  bowling_style: "",
  phone: "",
  email: "",
  residence: "",
  club_or_institute: "",
  playing_experience: "",
};

function Field({ label, required, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}

function SelectWrap({ children }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={15} className="absolute right-1 top-1/2 -translate-y-1/2 text-gold/60 pointer-events-none" />
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/registrations", form);
      setDone(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setDone(null);
  };

  return (
    <section id="register" className="py-16 md:py-20" data-testid="register-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16">
        <div className="md:col-span-4">
          <Reveal>
            <p className="text-ivory/55 text-sm leading-relaxed max-w-xs">
              Register to be considered for district trials and squad selection. The Association
              will reach out when trials for your age group are announced.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-10 space-y-3 text-sm text-ivory/70">
              {["Open to players from District Pathankot", "All age groups — U-14 to Seniors", "Men's & women's wings"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rotate-45 bg-gold" /> {x}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-12 border border-gold/20 rounded-xl p-6 max-w-xs" data-testid="register-help-box">
              <p className="text-[0.6rem] tracking-[0.28em] uppercase text-gold/80 mb-3">Questions?</p>
              <p className="text-sm text-ivory/60">
                <a href="tel:+918968044334" data-testid="register-help-phone" className="hover:text-gold transition-colors">
                  89680-44334
                </a>
                <span className="text-ivory/30 mx-2">·</span>
                <a
                  href="mailto:cricketpathankot@gmail.com"
                  data-testid="register-help-email"
                  className="hover:text-gold transition-colors break-all"
                >
                  cricketpathankot@gmail.com
                </a>
              </p>
              <p className="text-[0.62rem] text-ivory/40 mt-4 leading-relaxed">
                Carry proof of age and Pathankot district residence when called for trials.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="md:col-span-8">
          {done ? (
            <div
              className="border border-gold/25 bg-pavilion-mid/50 rounded-xl p-10 md:p-14 text-center"
              data-testid="registration-success"
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold/40 text-gold mb-6">
                <Check size={24} />
              </span>
              <h3 className="font-display text-3xl md:text-4xl text-ivory">Registration received.</h3>
              <p className="text-ivory/60 text-sm mt-4 max-w-md mx-auto leading-relaxed">
                Thank you, {done.full_name}. Your registration for the {done.age_group} squad is with
                the Association. Keep your phone handy — trial intimations are sent on this number.
              </p>
              <button
                onClick={reset}
                data-testid="register-again-button"
                className="mt-8 btn-gold bg-gold text-pavilion text-xs tracking-[0.2em] uppercase font-semibold px-8 py-3.5 rounded-full"
              >
                Register another player
              </button>
            </div>
          ) : (
            <Reveal>
              <form
                onSubmit={submit}
                data-testid="registration-form"
                className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-8 md:p-12"
              >
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                  <Field label="Full name" required>
                    <input
                      className="field"
                      required
                      data-testid="registration-full-name"
                      value={form.full_name}
                      onChange={set("full_name")}
                      placeholder="e.g. Arjun Sharma"
                    />
                  </Field>
                  <Field label="Date of birth" required>
                    <input
                      type="date"
                      className="field"
                      required
                      data-testid="registration-dob"
                      value={form.date_of_birth}
                      onChange={set("date_of_birth")}
                    />
                  </Field>
                  <Field label="Gender" required>
                    <SelectWrap>
                      <select className="field" required data-testid="registration-gender" value={form.gender} onChange={set("gender")}>
                        <option value="" disabled>
                          Select
                        </option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </SelectWrap>
                  </Field>
                  <Field label="Age group" required>
                    <SelectWrap>
                      <select className="field" required data-testid="registration-age-group" value={form.age_group} onChange={set("age_group")}>
                        <option value="" disabled>
                          Select
                        </option>
                        <option>U-14</option>
                        <option>U-16</option>
                        <option>U-19</option>
                        <option>U-23</option>
                        <option>Seniors</option>
                      </select>
                    </SelectWrap>
                  </Field>
                  <Field label="Playing role" required>
                    <SelectWrap>
                      <select className="field" required data-testid="registration-role" value={form.playing_role} onChange={set("playing_role")}>
                        <option value="" disabled>
                          Select
                        </option>
                        <option>Batsman</option>
                        <option>Bowler</option>
                        <option>All-Rounder</option>
                        <option>Wicket-Keeper</option>
                      </select>
                    </SelectWrap>
                  </Field>
                  <Field label="Batting style">
                    <SelectWrap>
                      <select className="field" data-testid="registration-batting-style" value={form.batting_style} onChange={set("batting_style")}>
                        <option value="" disabled>
                          Select
                        </option>
                        <option>Right-hand bat</option>
                        <option>Left-hand bat</option>
                      </select>
                    </SelectWrap>
                  </Field>
                  <Field label="Bowling style">
                    <SelectWrap>
                      <select className="field" data-testid="registration-bowling-style" value={form.bowling_style} onChange={set("bowling_style")}>
                        <option value="" disabled>
                          Select
                        </option>
                        <option>Right-arm fast</option>
                        <option>Right-arm medium</option>
                        <option>Left-arm fast</option>
                        <option>Left-arm medium</option>
                        <option>Off-spin</option>
                        <option>Leg-spin</option>
                        <option>Not a bowler</option>
                      </select>
                    </SelectWrap>
                  </Field>
                  <Field label="Phone" required>
                    <input
                      type="tel"
                      className="field"
                      required
                      data-testid="registration-phone"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+91"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      className="field"
                      required
                      data-testid="registration-email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Village / ward, Pathankot" required>
                    <input
                      className="field"
                      required
                      data-testid="registration-residence"
                      value={form.residence}
                      onChange={set("residence")}
                      placeholder="Area within District Pathankot"
                    />
                  </Field>
                  <Field label="Club / institute (optional)">
                    <input
                      className="field"
                      data-testid="registration-club"
                      value={form.club_or_institute}
                      onChange={set("club_or_institute")}
                      placeholder="If any"
                    />
                  </Field>
                  <Field label="Playing experience (optional)" className="sm:col-span-2">
                    <textarea
                      rows={3}
                      className="field resize-none"
                      data-testid="registration-experience"
                      value={form.playing_experience}
                      onChange={set("playing_experience")}
                      placeholder="Matches, tournaments, achievements"
                    />
                  </Field>
                </div>

                {error && (
                  <p className="mt-6 text-sm text-red-300" data-testid="registration-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  data-testid="registration-submit"
                  className="mt-10 btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-10 py-4 rounded-full disabled:opacity-60 inline-flex items-center gap-3"
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Submitting
                    </>
                  ) : (
                    "Submit registration"
                  )}
                </button>
              </form>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

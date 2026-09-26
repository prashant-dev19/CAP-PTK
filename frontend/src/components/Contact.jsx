import { useState } from "react";
import { ChevronDown, Loader2, Check, MapPin, Phone, Mail, Clock } from "lucide-react";
import { api, formatApiError } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

const SUBJECTS = ["General Enquiry", "Trials & Selection", "Registration Help", "Affiliation & Cricket Matters", "Media"];

const INFO = [
  { icon: MapPin, label: "Office", value: "[Office address — Pathankot, Punjab]" },
  { icon: Phone, label: "Phone", value: "[+91 — to be added]" },
  { icon: Mail, label: "Email", value: "[Email — to be added]" },
  { icon: Clock, label: "Office hours", value: "[To be added]" },
];

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/contact", form);
      setDone(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setDone(false);
  };

  return (
    <section id="contact" className="py-28 md:py-36" data-testid="contact-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 md:gap-16">
        <div className="md:col-span-4">
          <Eyebrow>Contact</Eyebrow>
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
              Reach the <em className="italic text-gold font-light">Association</em>.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-10 space-y-6">
              {INFO.map((i) => (
                <li key={i.label} className="flex items-start gap-4" data-testid="contact-info-item">
                  <span className="w-9 h-9 rounded-full border border-gold/25 flex items-center justify-center text-gold shrink-0">
                    <i.icon size={15} />
                  </span>
                  <span>
                    <span className="block text-[0.6rem] tracking-[0.25em] uppercase text-gold/70">{i.label}</span>
                    <span className="block text-sm text-ivory/70 italic mt-1">{i.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="md:col-span-8">
          {done ? (
            <div className="border border-gold/25 bg-pavilion-mid/50 rounded-xl p-10 md:p-14 text-center" data-testid="contact-success">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold/40 text-gold mb-6">
                <Check size={24} />
              </span>
              <h3 className="font-display text-3xl md:text-4xl text-ivory">Message sent.</h3>
              <p className="text-ivory/60 text-sm mt-4 max-w-md mx-auto leading-relaxed">
                Thank you for writing to the Cricket Association Pathankot. We will get back to you
                shortly.
              </p>
              <button
                onClick={reset}
                data-testid="contact-again-button"
                className="mt-8 btn-gold bg-gold text-pavilion text-xs tracking-[0.2em] uppercase font-semibold px-8 py-3.5 rounded-full"
              >
                Send another message
              </button>
            </div>
          ) : (
            <Reveal>
              <form
                onSubmit={submit}
                data-testid="contact-form"
                className="border border-gold/15 bg-pavilion-mid/40 rounded-xl p-8 md:p-12"
              >
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                  <label className="block">
                    <span className="field-label">Name *</span>
                    <input className="field" required data-testid="contact-name" value={form.name} onChange={set("name")} placeholder="Your name" />
                  </label>
                  <label className="block">
                    <span className="field-label">Email *</span>
                    <input type="email" className="field" required data-testid="contact-email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
                  </label>
                  <label className="block">
                    <span className="field-label">Phone</span>
                    <input type="tel" className="field" data-testid="contact-phone" value={form.phone} onChange={set("phone")} placeholder="+91" />
                  </label>
                  <label className="block">
                    <span className="field-label">Subject *</span>
                    <div className="relative">
                      <select className="field" required data-testid="contact-subject" value={form.subject} onChange={set("subject")}>
                        <option value="" disabled>
                          Select
                        </option>
                        {SUBJECTS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <ChevronDown size={15} className="absolute right-1 top-1/2 -translate-y-1/2 text-gold/60 pointer-events-none" />
                    </div>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="field-label">Message *</span>
                    <textarea rows={5} className="field resize-none" required data-testid="contact-message" value={form.message} onChange={set("message")} placeholder="How can the Association help?" />
                  </label>
                </div>

                {error && (
                  <p className="mt-6 text-sm text-red-300" data-testid="contact-error">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  data-testid="contact-submit"
                  className="mt-10 btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-10 py-4 rounded-full disabled:opacity-60 inline-flex items-center gap-3"
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Sending
                    </>
                  ) : (
                    "Send message"
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

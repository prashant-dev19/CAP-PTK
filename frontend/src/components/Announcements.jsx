import { useEffect, useState } from "react";
import { Pin, Instagram, X, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

const INSTAGRAM_URL = "https://www.instagram.com/cappathankot/";

const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const shareUrl = `${window.location.origin}/#announcements`;

  useEffect(() => {
    api
      .get("/announcements")
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  if (!items.length) return null;

  const pinned = items.find((a) => a.pinned) || null;
  const rest = items.filter((a) => !a.pinned);

  const whatsappHref = (a) =>
    `https://wa.me/?text=${encodeURIComponent(`${a.title} — Cricket Association Pathankot\n${shareUrl}`)}`;

  const shareRow = (a, compact = false) => (
    <div className="flex items-center gap-2">
      <span className="text-[0.58rem] tracking-[0.25em] uppercase text-ivory/40 mr-1">Share</span>
      <a
        href={whatsappHref(a)}
        target="_blank"
        rel="noreferrer noopener"
        data-testid={`notice-share-whatsapp-${a.id}`}
        aria-label="Share this notice on WhatsApp"
        title="Share on WhatsApp"
        className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors`}
      >
        <WhatsAppIcon size={compact ? 12 : 13} />
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer noopener"
        data-testid={`notice-share-instagram-${a.id}`}
        aria-label="Share via our Instagram"
        title="Open our Instagram to share"
        className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors`}
      >
        <Instagram size={compact ? 12 : 13} />
      </a>
    </div>
  );

  return (
    <section
      id="announcements"
      className="py-28 md:py-36 bg-pavilion-deep/40 border-y border-gold/10"
      data-testid="announcements-section"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Eyebrow>Notice Board</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
                Announcements<em className="italic text-gold font-light">.</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <p className="max-w-sm text-ivory/55 text-sm leading-relaxed">
              Notices from the Association — trials, selections and district matters. Click "View
              detail" to read any notice in full.
            </p>
          </Reveal>
        </div>

        {pinned && (
          <Reveal delay={0.08} className="mt-14">
            <article
              className="border border-gold/50 bg-gold/5 rounded-xl p-8 md:p-10"
              data-testid={`announcement-card-${pinned.id}`}
            >
              <span
                className="inline-flex items-center gap-1.5 text-[0.58rem] tracking-[0.25em] uppercase text-gold border border-gold/40 rounded-full px-3 py-1 mb-5"
                data-testid="announcement-pinned-badge"
              >
                <Pin size={10} /> Pinned
              </span>
              <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70">{fmtDate(pinned.created_at)}</p>
              <h3 className="font-display text-2xl md:text-3xl text-ivory mt-3">{pinned.title}</h3>
              <p className="text-sm text-ivory/60 leading-relaxed mt-3 whitespace-pre-line max-w-3xl">{pinned.body}</p>
              <div className="mt-6 pt-5 border-t border-gold/10">{shareRow(pinned)}</div>
            </article>
          </Reveal>
        )}

        {rest.length > 0 && (
          <Reveal delay={0.12} className="mt-10">
            <div
              className="border border-gold/15 bg-pavilion-mid/40 rounded-xl overflow-hidden"
              data-testid="notices-table"
            >
              <div className="hidden sm:grid grid-cols-[120px_1fr_140px] gap-4 px-6 md:px-8 py-4 border-b border-gold/15 text-[0.58rem] tracking-[0.25em] uppercase text-gold/70">
                <span>Date</span>
                <span>Notice</span>
                <span className="text-right">Action</span>
              </div>
              {rest.map((a) => (
                <div
                  key={a.id}
                  data-testid={`notice-row-${a.id}`}
                  className="flex flex-col sm:grid sm:grid-cols-[120px_1fr_140px] gap-2 sm:gap-4 px-6 md:px-8 py-5 border-b border-gold/10 last:border-0 items-start sm:items-center hover:bg-gold/5 transition-colors"
                >
                  <span className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/45">
                    {fmtDate(a.created_at)}
                  </span>
                  <span className="font-display text-xl md:text-2xl text-ivory leading-snug">{a.title}</span>
                  <button
                    onClick={() => setSelected(a)}
                    data-testid={`notice-view-${a.id}`}
                    className="justify-self-start sm:justify-self-end inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.22em] uppercase border border-gold/40 text-gold rounded-full px-4 py-2 hover:bg-gold hover:text-pavilion transition-colors"
                  >
                    View detail <ArrowUpRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            data-testid="notice-modal-wrapper"
          >
            <div
              className="absolute inset-0 bg-pavilion-deep/85 backdrop-blur-sm"
              onClick={() => setSelected(null)}
              data-testid="notice-modal-overlay"
            />
            <motion.div
              className="relative w-full max-w-2xl border border-gold/40 bg-pavilion-mid rounded-2xl p-8 md:p-12 max-h-[85vh] overflow-y-auto"
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 26, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              data-testid="notice-modal"
            >
              <button
                onClick={() => setSelected(null)}
                data-testid="notice-modal-close"
                aria-label="Close notice"
                className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-pavilion transition-colors"
              >
                <X size={15} />
              </button>
              <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70">{fmtDate(selected.created_at)}</p>
              <h3 className="font-display text-3xl md:text-4xl text-ivory mt-4 leading-snug pr-8">{selected.title}</h3>
              <p className="text-sm text-ivory/70 leading-relaxed mt-6 whitespace-pre-line">{selected.body}</p>
              <div className="mt-8 pt-6 border-t border-gold/10">{shareRow(selected, true)}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

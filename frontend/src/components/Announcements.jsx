import { useEffect, useState } from "react";
import { Pin, Instagram } from "lucide-react";
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
  const shareUrl = `${window.location.origin}/#announcements`;

  useEffect(() => {
    api
      .get("/announcements")
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]));
  }, []);

  if (!items.length) return null;

  const whatsappHref = (a) =>
    `https://wa.me/?text=${encodeURIComponent(`${a.title} — Cricket Association Pathankot\n${shareUrl}`)}`;

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
              Notices from the Association — trials, selections and district matters, as posted by
              the officials. Spread the word on WhatsApp.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {items.map((a, i) => (
            <Reveal key={a.id} delay={i * 0.06} className="h-full">
              <article
                className={`h-full border rounded-xl p-8 ${
                  a.pinned ? "border-gold/50 bg-gold/5" : "border-gold/15 bg-pavilion-mid/40"
                }`}
                data-testid={`announcement-card-${a.id}`}
              >
                {a.pinned && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[0.58rem] tracking-[0.25em] uppercase text-gold border border-gold/40 rounded-full px-3 py-1 mb-5"
                    data-testid="announcement-pinned-badge"
                  >
                    <Pin size={10} /> Pinned
                  </span>
                )}
                <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70">{fmtDate(a.created_at)}</p>
                <h3 className="font-display text-2xl text-ivory mt-3">{a.title}</h3>
                <p className="text-sm text-ivory/60 leading-relaxed mt-3 whitespace-pre-line">{a.body}</p>

                <div className="flex items-center gap-2 mt-6 pt-5 border-t border-gold/10">
                  <span className="text-[0.58rem] tracking-[0.25em] uppercase text-ivory/40 mr-1">Share</span>
                  <a
                    href={whatsappHref(a)}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-testid={`notice-share-whatsapp-${a.id}`}
                    aria-label="Share this notice on WhatsApp"
                    title="Share on WhatsApp"
                    className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors"
                  >
                    <WhatsAppIcon size={13} />
                  </a>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    data-testid={`notice-share-instagram-${a.id}`}
                    aria-label="Share via our Instagram"
                    title="Open our Instagram to share"
                    className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors"
                  >
                    <Instagram size={13} />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

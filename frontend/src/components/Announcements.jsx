import { useEffect, useState } from "react";
import { Pin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { NoticeTable, NoticeModal, padNo } from "@/components/NoticesList";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .get("/announcements?page=1&limit=10")
      .then(({ data }) => {
        setItems(data?.items || []);
        setTotal(data?.total || 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      });
  }, []);

  if (!items.length) return null;

  const pinned = items.find((a) => a.pinned) || null;
  const rest = items.filter((a) => !a.pinned);
  const tableNotices = rest.slice(0, 5);
  const hasMore = total > (pinned ? 1 : 0) + 5;

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
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 text-[0.58rem] tracking-[0.25em] uppercase text-gold border border-gold/40 rounded-full px-3 py-1"
                  data-testid="announcement-pinned-badge"
                >
                  <Pin size={10} /> Pinned
                </span>
                <span className="font-display text-gold/80 text-lg italic" data-testid="announcement-pinned-number">
                  {padNo(pinned.notice_no)}
                </span>
              </div>
              <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70 mt-4">
                {new Date(pinned.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <h3 className="font-display text-2xl md:text-3xl text-ivory mt-3">{pinned.title}</h3>
              <p className="text-sm text-ivory/60 leading-relaxed mt-3 whitespace-pre-line max-w-3xl">{pinned.body}</p>
              {pinned.link_url && (
                <a
                  href={pinned.link_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-testid="pinned-notice-link"
                  className="mt-5 inline-flex items-center gap-2 text-[0.62rem] tracking-[0.22em] uppercase border border-gold/40 text-gold rounded-full px-5 py-2.5 hover:bg-gold hover:text-pavilion transition-colors"
                >
                  <ExternalLink size={12} /> Open link
                </a>
              )}
            </article>
          </Reveal>
        )}

        {tableNotices.length > 0 && (
          <Reveal delay={0.12} className="mt-10">
            <NoticeTable notices={tableNotices} onSelect={setSelected} />
          </Reveal>
        )}

        {hasMore && (
          <Reveal delay={0.16}>
            <div className="mt-8 flex justify-center sm:justify-end">
              <Link
                to="/notices"
                data-testid="notice-view-all"
                className="btn-gold bg-gold text-pavilion text-[0.65rem] tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full inline-flex items-center gap-2"
              >
                View all notices <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>
        )}
      </div>

      <NoticeModal notice={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

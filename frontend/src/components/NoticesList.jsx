import { useEffect } from "react";
import { Pin, Instagram, X, ArrowUpRight, Link2, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons";

const INSTAGRAM_URL = "https://www.instagram.com/cappathankot/";

export const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
};

export const padNo = (n) => `#${String(n || 0).padStart(2, "0")}`;

export function ShareRow({ notice, compact = false }) {
  const shareUrl = `${window.location.origin}/#announcements`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${notice.title} — Cricket Association Pathankot\n${shareUrl}`
  )}`;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.58rem] tracking-[0.25em] uppercase text-ivory/40 mr-1">Share</span>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer noopener"
        data-testid={`notice-share-whatsapp-${notice.id}`}
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
        data-testid={`notice-share-instagram-${notice.id}`}
        aria-label="Share via our Instagram"
        title="Open our Instagram to share"
        className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full border border-gold/30 flex items-center justify-center text-gold/80 hover:bg-gold hover:text-pavilion transition-colors`}
      >
        <Instagram size={compact ? 12 : 13} />
      </a>
    </div>
  );
}

export function NoticeTable({ notices, onSelect, showPin = false }) {
  return (
    <div
      className="border border-gold/15 bg-pavilion-mid/40 rounded-xl overflow-hidden"
      data-testid="notices-table"
    >
      <div className="hidden sm:grid grid-cols-[70px_120px_1fr_150px] gap-4 px-6 md:px-8 py-4 border-b border-gold/15 text-[0.58rem] tracking-[0.25em] uppercase text-gold/70">
        <span>No.</span>
        <span>Date</span>
        <span>Notice</span>
        <span className="text-right">Action</span>
      </div>
      {notices.map((a) => (
        <div
          key={a.id}
          data-testid={`notice-row-${a.id}`}
          className="flex flex-col sm:grid sm:grid-cols-[70px_120px_1fr_150px] gap-2 sm:gap-4 px-6 md:px-8 py-5 border-b border-gold/10 last:border-0 items-start sm:items-center hover:bg-gold/5 transition-colors"
        >
          <span className="font-display text-lg text-gold/80" data-testid={`notice-number-${a.id}`}>
            {padNo(a.notice_no)}
          </span>
          <span className="text-[0.6rem] tracking-[0.2em] uppercase text-ivory/45">{fmtDate(a.created_at)}</span>
          <span className="font-display text-xl md:text-2xl text-ivory leading-snug flex items-center gap-2.5 flex-wrap">
            {a.title}
            {a.link_url && (
              <a
                href={a.link_url}
                target="_blank"
                rel="noreferrer noopener"
                data-testid={`notice-link-${a.id}`}
                aria-label="Open notice link"
                title={a.link_url}
                className="text-gold/70 hover:text-gold transition-colors inline-flex"
              >
                <Link2 size={15} />
              </a>
            )}
            {showPin && a.pinned && (
              <span className="inline-flex items-center gap-1 text-[0.55rem] tracking-[0.22em] uppercase text-gold border border-gold/40 rounded-full px-2.5 py-0.5">
                <Pin size={9} /> Pinned
              </span>
            )}
          </span>
          <button
            onClick={() => onSelect(a)}
            data-testid={`notice-view-${a.id}`}
            className="justify-self-start sm:justify-self-end inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.22em] uppercase border border-gold/40 text-gold rounded-full px-4 py-2 hover:bg-gold hover:text-pavilion transition-colors"
          >
            View detail <ArrowUpRight size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function NoticeModal({ notice, onClose }) {
  useEffect(() => {
    document.body.style.overflow = notice ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [notice]);

  return (
    <AnimatePresence>
      {notice && (
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
            onClick={onClose}
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
              onClick={onClose}
              data-testid="notice-modal-close"
              aria-label="Close notice"
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-pavilion transition-colors"
            >
              <X size={15} />
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display text-gold text-lg italic">{padNo(notice.notice_no)}</span>
              {notice.pinned && (
                <span className="inline-flex items-center gap-1.5 text-[0.58rem] tracking-[0.25em] uppercase text-gold border border-gold/40 rounded-full px-3 py-1">
                  <Pin size={10} /> Pinned
                </span>
              )}
            </div>
            <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/70 mt-3">{fmtDate(notice.created_at)}</p>
            <h3 className="font-display text-3xl md:text-4xl text-ivory mt-4 leading-snug pr-8">{notice.title}</h3>
            <p className="text-sm text-ivory/70 leading-relaxed mt-6 whitespace-pre-line">{notice.body}</p>
            {notice.link_url && (
              <a
                href={notice.link_url}
                target="_blank"
                rel="noreferrer noopener"
                data-testid="notice-modal-link"
                className="mt-6 inline-flex items-center gap-2 text-[0.62rem] tracking-[0.22em] uppercase border border-gold/40 text-gold rounded-full px-5 py-2.5 hover:bg-gold hover:text-pavilion transition-colors"
              >
                <ExternalLink size={12} /> Open link
              </a>
            )}
            <div className="mt-8 pt-6 border-t border-gold/10">
              <ShareRow notice={notice} compact />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Pagination({ page, pages, onPage, testPrefix = "notices" }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) nums.push(i);
  } else {
    nums.push(1);
    if (page > 3) nums.push("gap");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) nums.push(i);
    if (page < pages - 2) nums.push("gap");
    nums.push(pages);
  }
  const pill = (active) =>
    `min-w-9 h-9 px-3.5 inline-flex items-center justify-center rounded-full text-[0.65rem] tracking-[0.14em] transition-colors ${
      active
        ? "bg-gold text-pavilion font-semibold"
        : "border border-gold/30 text-gold/80 hover:bg-gold hover:text-pavilion"
    }`;
  return (
    <nav
      className="flex items-center justify-center gap-2 flex-wrap"
      data-testid={`${testPrefix}-pagination`}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        data-testid={`${testPrefix}-prev`}
        className={`${pill(false)} px-5 uppercase disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold/80`}
      >
        Prev
      </button>
      {nums.map((n, i) =>
        n === "gap" ? (
          <span key={`gap-${i}`} className="text-ivory/40 text-sm px-1" data-testid={`${testPrefix}-ellipsis-${i}`}>
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onPage(n)}
            data-testid={`${testPrefix}-page-${n}`}
            aria-label={`Page ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={pill(n === page)}
          >
            {n}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        data-testid={`${testPrefix}-next`}
        className={`${pill(false)} px-5 uppercase disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold/80`}
      >
        Next
      </button>
    </nav>
  );
}

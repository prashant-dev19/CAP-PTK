import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

const KEY = "cap-popup-dismissed";

export default function HomePopup() {
  const [data, setData] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    api
      .get("/popup")
      .then(({ data: d }) => {
        if (!d) return;
        setData(d);
        const hasContent = (d.title || "").trim() || (d.message || "").trim() || (d.image_url || "").trim();
        if (d.enabled && hasContent && !sessionStorage.getItem(KEY)) {
          timer = setTimeout(() => setVisible(true), 1200);
        }
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center px-4 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          data-testid="home-popup-wrapper"
        >
          <div
            className="absolute inset-0 bg-pavilion-deep/85 backdrop-blur-sm"
            onClick={close}
            data-testid="home-popup-overlay"
          />
          <motion.div
            className="relative w-full max-w-md border border-gold/40 bg-pavilion-mid rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            data-testid="home-popup"
          >
            <button
              onClick={close}
              data-testid="home-popup-close"
              aria-label="Close pop-up"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full border border-gold/40 bg-pavilion-deep/60 backdrop-blur flex items-center justify-center text-gold hover:bg-gold hover:text-pavilion transition-colors"
            >
              <X size={15} />
            </button>

            {data.image_url?.trim() && (
              <img
                src={data.image_url}
                alt="Association announcement"
                className="w-full aspect-[4/3] object-cover"
                data-testid="home-popup-image"
              />
            )}

            <div className="p-8">
              {data.title?.trim() && (
                <h3 className="font-display text-2xl md:text-3xl text-ivory leading-snug" data-testid="home-popup-title">
                  {data.title}
                </h3>
              )}
              {data.message?.trim() && (
                <p
                  className="text-sm text-ivory/65 leading-relaxed mt-3 whitespace-pre-line"
                  data-testid="home-popup-message"
                >
                  {data.message}
                </p>
              )}

              <div className="flex items-center justify-between mt-7 pt-5 border-t border-gold/10">
                <Link
                  to="/notices"
                  data-testid="home-popup-notices-link"
                  className="text-[0.62rem] tracking-[0.22em] uppercase text-gold link-underline"
                >
                  View all notices
                </Link>
                <button
                  onClick={close}
                  data-testid="home-popup-dismiss"
                  className="text-[0.62rem] tracking-[0.22em] uppercase text-ivory/40 hover:text-ivory transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NoticeTable, NoticeModal, Pagination } from "@/components/NoticesList";
import { api } from "@/lib/api";
import Reveal, { Eyebrow } from "@/components/Reveal";

export default function NoticesPage() {
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadPage = (p) => {
    api
      .get(`/announcements?page=${p}&limit=10`)
      .then(({ data }) => {
        setItems(data.items || []);
        setMeta({ total: data.total, page: data.page, pages: data.pages, limit: data.limit });
      })
      .catch(() => {
        setItems([]);
        setMeta(null);
      });
  };

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = (p) => {
    loadPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body" data-testid="notices-page">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main className="pt-32 md:pt-44 pb-10">
        <header className="max-w-7xl mx-auto px-6 md:px-12">
          <Eyebrow>Notice Board</Eyebrow>
          <Reveal>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-ivory mt-6 leading-[1.02]">
              All <em className="italic text-gold font-light">notices</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-ivory/55 text-sm leading-relaxed">
              Every notice from the Association, listed in full — trials, selections and district
              matters. Click "View detail" to read any notice.
            </p>
          </Reveal>
        </header>

        <div className="max-w-7xl mx-auto px-6 md:px-12 mt-14">
          {items === null ? (
            <div className="flex items-center gap-3 text-ivory/50 text-sm py-24 justify-center">
              <Loader2 size={18} className="animate-spin text-gold" /> Loading notices…
            </div>
          ) : items.length === 0 ? (
            <p className="text-ivory/40 text-sm py-24 text-center" data-testid="notices-page-empty">
              No notices have been posted yet.
            </p>
          ) : (
            <>
              <Reveal>
                <NoticeTable notices={items} onSelect={setSelected} showPin />
              </Reveal>
              <div className="mt-12 flex flex-col items-center gap-4">
                {meta && meta.total > 0 && (
                  <p
                    className="text-[0.62rem] tracking-[0.24em] uppercase text-ivory/40"
                    data-testid="notices-count"
                  >
                    Showing {(meta.page - 1) * meta.limit + 1}–
                    {Math.min(meta.total, meta.page * meta.limit)} of {meta.total} notices
                  </p>
                )}
                {meta && (
                  <Pagination page={meta.page} pages={meta.pages} onPage={goToPage} testPrefix="notices" />
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <NoticeModal notice={selected} onClose={() => setSelected(null)} />
      <Footer />
    </div>
  );
}

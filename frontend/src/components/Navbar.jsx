import { useEffect, useState } from "react";
import { Menu, X, Megaphone, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import Logo from "@/components/Logo";

const LINKS = [
  { label: "The Association", href: "#about" },
  { label: "Squads", href: "#teams" },
  { label: "The Pathway", href: "#pathway" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api
      .get("/announcements")
      .then(({ data }) => setNotice(data && data.length ? data[0] : null))
      .catch(() => setNotice(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50">
        <div
          className={`overflow-hidden transition-all duration-500 ${
            notice && !scrolled && !open ? "max-h-12" : "max-h-0"
          }`}
          data-testid="notice-bar"
        >
          <a
            href="#announcements"
            data-testid="notice-bar-link"
            className="flex items-center justify-center gap-3 bg-gold text-pavilion px-6 py-2.5"
          >
            <Megaphone size={13} className="shrink-0" />
            <span className="text-[0.6rem] md:text-[0.65rem] tracking-[0.25em] uppercase font-semibold min-w-0 truncate">
              <span className="opacity-60">Notice</span> · {notice?.title}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.25em] uppercase shrink-0">
              View board <ArrowRight size={11} />
            </span>
          </a>
        </div>
        <div
          className={`transition-colors duration-500 ${
            scrolled || open
              ? "bg-pavilion/70 backdrop-blur-xl border-b border-gold/10"
              : "bg-transparent border-b border-transparent"
          }`}
        >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
          <a href="#top" data-testid="nav-logo-link" aria-label="Cricket Association Pathankot — home" onClick={() => setOpen(false)}>
            <Logo />
          </a>
          <nav className="hidden md:flex items-center gap-10">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-testid={`nav-link-${l.href.slice(1)}`}
                className="link-underline text-[0.68rem] tracking-[0.25em] uppercase text-ivory/70 hover:text-gold transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#register"
              data-testid="nav-register-cta"
              className="btn-gold bg-gold text-pavilion text-[0.68rem] tracking-[0.25em] uppercase font-semibold px-6 py-3 rounded-full"
            >
              Register
            </a>
          </nav>
          <button
            className="md:hidden text-ivory p-2"
            data-testid="nav-mobile-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-pavilion/95 backdrop-blur-xl md:hidden" data-testid="nav-mobile-menu">
          <div className="pt-32 px-8 flex flex-col gap-7">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-display text-4xl text-ivory hover:text-gold transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#register"
              onClick={() => setOpen(false)}
              className="font-display text-4xl text-gold italic"
              data-testid="nav-mobile-register"
            >
              Register as a Player
            </a>
          </div>
        </div>
      )}
    </>
  );
}

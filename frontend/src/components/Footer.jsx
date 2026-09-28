import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import { useSiteContent } from "@/context/SiteContent";

const LINKS = [
  { label: "The Association", href: "/#about" },
  { label: "Squads", href: "/squads" },
  { label: "The Pathway", href: "/#pathway" },
  { label: "Register", href: "/register" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  const c = useSiteContent();
  const bearers = (c.bearers || []).filter((b) => b.role || b.name);
  const tel = `tel:${c.contact_phone.replace(/[^+\d]/g, "")}`;

  return (
    <footer className="bg-pavilion-deep border-t border-gold/15 pt-20 md:pt-28 overflow-hidden" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-6 text-sm text-ivory/50 leading-relaxed max-w-xs font-light">{c.footer_tagline}</p>
            {bearers.length > 0 && (
              <div className="mt-8 max-w-xs">
                <p className="text-gold/80 text-[0.6rem] tracking-[0.3em] uppercase mb-4">Office Bearers</p>
                {bearers.map((b) => (
                  <p
                    key={b.role}
                    className="flex justify-between border-b border-ivory/5 pb-2 mb-2 text-sm"
                    data-testid="footer-bearer"
                  >
                    <span className="text-ivory/40">{b.role}</span>
                    <span className="italic text-ivory/60">{b.name}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <p className="text-gold/80 text-[0.6rem] tracking-[0.3em] uppercase mb-5">Explore</p>
            <ul className="space-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    data-testid={`footer-link-${l.href.replace("/", "").replace("#", "") || "home"}`}
                    className="text-sm text-ivory/60 hover:text-gold transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="text-gold/80 text-[0.6rem] tracking-[0.3em] uppercase mb-5">Reach Us</p>
            <ul className="space-y-3 text-sm text-ivory/60">
              <li>{c.contact_address}</li>
              <li>
                <a href={tel} data-testid="footer-phone" className="hover:text-gold transition-colors">
                  {c.contact_phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${c.contact_email}`}
                  data-testid="footer-email"
                  className="hover:text-gold transition-colors"
                >
                  {c.contact_email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Reveal>
          <p className="font-display text-[24vw] md:text-[16vw] leading-[0.78] text-ivory/[0.05] text-center select-none mt-16 -mb-4">
            CAP
          </p>
        </Reveal>
      </div>

      <div className="border-t border-ivory/5 relative z-10 bg-pavilion-deep">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[0.62rem] tracking-[0.2em] uppercase text-ivory/35">
          <span>© {new Date().getFullYear()} Cricket Association Pathankot</span>
          <span>Affiliated to PCA, Mohali</span>
          <a href="/admin" data-testid="footer-admin-link" className="hover:text-gold transition-colors">
            Admin
          </a>
        </div>
      </div>

      <div className="border-t border-ivory/5 relative z-10 bg-pavilion-deep" data-testid="footer-credit">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 text-center text-[0.6rem] tracking-[0.2em] uppercase text-ivory/30">
          Designed by{" "}
          <a
            href="https://www.iravatisolutions.com"
            target="_blank"
            rel="noreferrer noopener"
            data-testid="footer-credit-link"
            className="text-gold/60 hover:text-gold transition-colors"
          >
            Iravati Solutions
          </a>
        </div>
      </div>
    </footer>
  );
}

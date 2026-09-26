import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";

const BEARERS = [
  { role: "President", name: "[Name to be announced]" },
  { role: "Secretary", name: "[Name to be announced]" },
  { role: "Joint Secretary", name: "[Name to be announced]" },
  { role: "Treasurer", name: "[Name to be announced]" },
];

const LINKS = [
  { label: "The Association", href: "#about" },
  { label: "Squads", href: "#teams" },
  { label: "The Pathway", href: "#pathway" },
  { label: "Register", href: "#register" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="bg-pavilion-deep border-t border-gold/15 pt-20 md:pt-28 overflow-hidden" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-6 text-sm text-ivory/50 leading-relaxed max-w-xs font-light">
              The official cricketing body of District Pathankot, affiliated to the Punjab Cricket
              Association, Mohali.
            </p>
            <div className="mt-8 max-w-xs">
              <p className="text-gold/80 text-[0.6rem] tracking-[0.3em] uppercase mb-4">Office Bearers</p>
              {BEARERS.map((b) => (
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
          </div>

          <div className="md:col-span-3">
            <p className="text-gold/80 text-[0.6rem] tracking-[0.3em] uppercase mb-5">Explore</p>
            <ul className="space-y-3">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    data-testid={`footer-link-${l.href.slice(1)}`}
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
              <li className="italic">[Office address — Pathankot, Punjab]</li>
              <li className="italic">[+91 — phone to be added]</li>
              <li className="italic">[Email to be added]</li>
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
    </footer>
  );
}

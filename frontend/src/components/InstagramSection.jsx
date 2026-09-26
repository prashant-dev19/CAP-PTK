import { useEffect, useRef } from "react";
import { Instagram as InstagramIcon } from "lucide-react";
import Reveal, { Eyebrow } from "@/components/Reveal";

const PROFILE_URL = "https://www.instagram.com/cappathankot/";

export default function InstagramSection() {
  const loaded = useRef(false);

  useEffect(() => {
    const process = () => {
      if (window.instgrm?.Embeds) window.instgrm.Embeds.process();
    };
    if (loaded.current) {
      process();
      return;
    }
    loaded.current = true;
    if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.instagram.com/embed.js";
      script.onload = process;
      document.body.appendChild(script);
    } else {
      process();
    }
  }, []);

  return (
    <section id="instagram" className="py-28 md:py-36 border-t border-gold/10" data-testid="instagram-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-5">
            <Eyebrow>Instagram</Eyebrow>
            <Reveal>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-ivory mt-6 leading-[1.05]">
                Follow the game, <em className="italic text-gold font-light">off the field</em>.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 text-ivory/55 text-sm leading-relaxed max-w-sm">
                Match-day moments, trial announcements and district cricket — straight from the
                Association's feed.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noreferrer noopener"
                data-testid="instagram-follow-link"
                className="mt-10 inline-flex items-center gap-3 btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-8 py-4 rounded-full"
              >
                <InstagramIcon size={16} /> Follow @cappathankot
              </a>
            </Reveal>
          </div>

          <div className="md:col-span-7 flex justify-center" data-testid="instagram-embed">
            <Reveal className="w-full max-w-[540px]" delay={0.1}>
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={PROFILE_URL}
                data-instgrm-version="14"
                style={{
                  background: "#FFFFFF",
                  border: 0,
                  borderRadius: 16,
                  margin: 0,
                  maxWidth: 540,
                  minWidth: 288,
                  padding: 0,
                  width: "calc(100% - 2px)",
                }}
              >
                <a href={PROFILE_URL} target="_blank" rel="noreferrer noopener">
                  View @cappathankot on Instagram
                </a>
              </blockquote>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

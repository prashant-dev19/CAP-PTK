import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";

const HERO_IMG =
  "https://images.unsplash.com/photo-1759733845137-5eb942436f49?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTF8MHwxfHNlYXJjaHwzfHxjcmlja2V0JTIwc3RhZGl1bSUyMGdyZWVufGVufDB8fHx8MTc5MDQxNjIzMHww&ixlib=rb-4.1.0&q=85";

const STATS = [
  { n: "10", l: "District Squads" },
  { n: "05", l: "Age Groups" },
  { n: "M & W", l: "Men's & Women's Wings" },
];

const lineAnim = (i) => ({
  initial: { y: "112%" },
  animate: { y: "0%" },
  transition: { duration: 1.1, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] },
});

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);

  return (
    <section ref={ref} id="top" className="relative min-h-screen flex flex-col overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img
          src={HERO_IMG}
          alt="Cricket stadium under lights"
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-pavilion/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-pavilion via-pavilion/30 to-pavilion/70" />
      </motion.div>

      <motion.div
        className="absolute right-[7%] top-[20%] hidden lg:block"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 0.85, y: 0 }}
        transition={{ delay: 1.4, duration: 1.4 }}
      >
        <LogoMark className="h-44 w-44 drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-36 md:pt-44 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.9 }}
          className="flex items-center gap-3 mb-8"
          data-testid="hero-eyebrow"
        >
          <span className="h-px w-12 bg-gold/70" />
          <span className="text-[0.62rem] md:text-xs tracking-[0.3em] uppercase text-gold font-medium">
            Official Cricketing Body · District Pathankot
          </span>
        </motion.div>

        <h1 className="font-display font-medium tracking-tight leading-[0.98] text-[15vw] sm:text-7xl md:text-8xl lg:text-[7.2rem]">
          <span className="block overflow-hidden pb-1">
            <motion.span className="block text-ivory" {...lineAnim(0)} data-testid="hero-line-1">
              The Home of
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-2">
            <motion.span className="block" {...lineAnim(1)} data-testid="hero-line-2">
              <em className="italic text-gold font-light">Pathankot</em> Cricket
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-ivory/70 text-sm md:text-base leading-relaxed font-light"
          data-testid="hero-subline"
        >
          The official cricketing body of District Pathankot, affiliated to the Punjab Cricket
          Association, Mohali — conducting trials, selecting players and fielding squads from
          U-14 to Seniors, for men and women, into inter-district competition.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center gap-8"
        >
          <a
            href="#register"
            data-testid="hero-register-cta"
            className="btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-9 py-4 rounded-full"
          >
            Register as a Player
          </a>
          <a
            href="#pathway"
            data-testid="hero-pathway-link"
            className="link-underline flex items-center gap-2 text-xs tracking-[0.22em] uppercase text-ivory/80 hover:text-gold transition-colors"
          >
            Explore the Pathway <ArrowDown size={14} />
          </a>
        </motion.div>
      </div>

      <div className="relative z-10 mt-16">
        <Reveal delay={1.2} y={10}>
          <div className="border-t border-gold/10">
            <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-3 gap-6 py-7">
              {STATS.map((s) => (
                <div key={s.l} data-testid="hero-stat">
                  <p className="font-display text-2xl md:text-4xl text-gold">{s.n}</p>
                  <p className="text-[0.55rem] md:text-[0.65rem] tracking-[0.22em] uppercase text-ivory/45 mt-1">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

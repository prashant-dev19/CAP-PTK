import { CalendarDays } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { useSiteContent } from "@/context/SiteContent";

export default function TrialsBanner() {
  const c = useSiteContent();
  return (
    <section className="py-16 md:py-20" data-testid="trials-banner-section">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Reveal>
          <div className="border border-gold/25 bg-pavilion-mid/50 rounded-xl px-8 md:px-12 py-8 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="w-11 h-11 rounded-full border border-gold/40 text-gold flex items-center justify-center shrink-0">
                <CalendarDays size={18} />
              </span>
              <div>
                <p className="text-[0.62rem] tracking-[0.3em] uppercase text-gold/80">{c.trials_label}</p>
                <p className="font-display text-2xl md:text-3xl text-ivory mt-1 leading-snug">
                  {c.trials_heading}
                </p>
              </div>
            </div>
            <div className="md:text-right" data-testid="trials-dates">
              <p className="text-[0.62rem] tracking-[0.3em] uppercase text-ivory/40">Dates</p>
              <p className="font-display text-2xl md:text-3xl text-gold italic mt-1">{c.trials_dates}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

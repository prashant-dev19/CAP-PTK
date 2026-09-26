import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Register from "@/components/Register";
import Reveal, { Eyebrow } from "@/components/Reveal";

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body" data-testid="register-page">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main className="pt-32 md:pt-44">
        <header className="max-w-7xl mx-auto px-6 md:px-12">
          <Eyebrow>Player Registration</Eyebrow>
          <Reveal>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-ivory mt-6 leading-[1.02]">
              Take the field for <em className="italic text-gold font-light">Pathankot</em>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-ivory/55 text-sm leading-relaxed">
              One registration puts you in line for district trials and squad selection across all
              age groups — men's and women's wings.
            </p>
          </Reveal>
        </header>
        <Register />
      </main>
      <Footer />
    </div>
  );
}

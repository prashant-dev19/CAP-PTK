import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Teams from "@/components/Teams";
import Process from "@/components/Process";
import Register from "@/components/Register";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body" data-testid="home-page">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Teams />
        <Process />
        <Register />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

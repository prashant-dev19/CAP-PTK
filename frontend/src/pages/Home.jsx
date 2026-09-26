import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import TrialsBanner from "@/components/TrialsBanner";
import About from "@/components/About";
import Teams from "@/components/Teams";
import Process from "@/components/Process";
import Announcements from "@/components/Announcements";
import Gallery from "@/components/Gallery";
import Contact from "@/components/Contact";
import InstagramSection from "@/components/InstagramSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body" data-testid="home-page">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <TrialsBanner />
        <About />
        <Teams />
        <Process />
        <Announcements />
        <Gallery />
        <Contact />
        <InstagramSection />
      </main>
      <Footer />
    </div>
  );
}

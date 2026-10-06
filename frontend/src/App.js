import { Component, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { SiteContentProvider, useSiteContent } from "@/context/SiteContent";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import SquadsPage from "@/pages/SquadsPage";
import NoticesPage from "@/pages/NoticesPage";
import RegisterPage from "@/pages/RegisterPage";

function PageUnavailable() {
  return (
    <div className="relative min-h-screen bg-pavilion text-ivory font-body flex flex-col" data-testid="page-unavailable">
      <div aria-hidden="true" className="grain" />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-40 pb-24">
        <div className="text-center max-w-md">
          <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold/70">Page unavailable</p>
          <h1 className="font-display text-5xl text-ivory mt-6 leading-tight">
            This section is currently <em className="italic text-gold font-light">unavailable</em>.
          </h1>
          <p className="text-ivory/55 text-sm mt-5 leading-relaxed">
            The Association has temporarily closed this section of the website. Please check back
            soon.
          </p>
          <a
            href="/"
            data-testid="unavailable-home-link"
            className="mt-10 btn-gold bg-gold text-pavilion text-xs tracking-[0.22em] uppercase font-semibold px-8 py-3.5 rounded-full inline-flex items-center gap-2"
          >
            Back to home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PageGuard({ page, children }) {
  const c = useSiteContent();
  if (c?.menu?.pages?.[page] === false) return <PageUnavailable />;
  return children;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("App error boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-pavilion text-ivory font-body">
          <div className="text-center px-6">
            <p className="font-display text-4xl text-gold mb-3">Something went wrong</p>
            <p className="text-ivory/60 text-sm">Please refresh the page to continue.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      anchors: true,
    });
    window.__lenis = lenis;
    let rafId;
    const loop = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <SiteContentProvider>
        <BrowserRouter>
          <ScrollToTop />
          <SmoothScroll />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/register"
              element={
                <PageGuard page="register">
                  <RegisterPage />
                </PageGuard>
              }
            />
            <Route
              path="/squads"
              element={
                <PageGuard page="squads">
                  <SquadsPage />
                </PageGuard>
              }
            />
            <Route
              path="/notices"
              element={
                <PageGuard page="notices">
                  <NoticesPage />
                </PageGuard>
              }
            />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </SiteContentProvider>
    </ErrorBoundary>
  );
}

export default App;

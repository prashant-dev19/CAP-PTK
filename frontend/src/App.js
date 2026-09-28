import { Component, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { SiteContentProvider } from "@/context/SiteContent";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import SquadsPage from "@/pages/SquadsPage";
import NoticesPage from "@/pages/NoticesPage";
import RegisterPage from "@/pages/RegisterPage";

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
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/squads" element={<SquadsPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </SiteContentProvider>
    </ErrorBoundary>
  );
}

export default App;

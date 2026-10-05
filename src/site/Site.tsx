import { useCallback, useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { track } from "../lib/analytics";
import { useStore } from "../lib/store";
import { contentStore } from "../data/stores";
import CursorGlow from "./components/CursorGlow";
import ExcerptModal from "./components/ExcerptModal";
import Header, { type NavItem } from "./components/Header";
import MobileBuyBar from "./components/MobileBuyBar";
import Preloader from "./components/Preloader";
import ScrollChrome from "./components/ScrollChrome";
import Starfield from "./components/Starfield";
import ThemeMarquee from "./components/ThemeMarquee";
import Author from "./sections/Author";
import BookIntro from "./sections/BookIntro";
import Buy from "./sections/Buy";
import Chapters from "./sections/Chapters";
import Explores from "./sections/Explores";
import Footer from "./sections/Footer";
import Hero from "./sections/Hero";
import Impact from "./sections/Impact";
import Manifesto from "./sections/Manifesto";
import Reviews from "./sections/Reviews";
import { primaryRetailer } from "./buy";
import { scrollToTarget, setLenis } from "./smooth";

export default function Site() {
  const content = useStore(contentStore);
  const { sections: show } = content;
  const retailer = primaryRetailer(content.buy.retailers);
  const hasExcerpt = content.excerpt.body.trim().length > 0;
  const [excerptOpen, setExcerptOpen] = useState(false);

  // smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis share one clock
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  // images arriving late change section heights; re-measure the scroll animations when they do
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    let t: ReturnType<typeof setTimeout>;
    const onImg = (e: Event) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        clearTimeout(t);
        t = setTimeout(refresh, 200);
      }
    };
    document.addEventListener("load", onImg, true);
    return () => {
      window.removeEventListener("load", refresh);
      document.removeEventListener("load", onImg, true);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    document.title = content.seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", content.seo.description);
  }, [content.seo.title, content.seo.description]);

  useEffect(() => {
    track("visit");
    track("pageview");
  }, []);

  const nav = useMemo<NavItem[]>(() => {
    const items: (NavItem | false)[] = [
      { id: "home", label: "Home" },
      show.book && { id: "about-book", label: "About the Book" },
      show.author && { id: "author", label: "About the Author" },
      show.chapters && { id: "chapters", label: "Chapters" },
      show.reviews && content.reviews.items.length > 0 && { id: "reviews", label: "Reviews" },
    ];
    return items.filter(Boolean) as NavItem[];
  }, [show.book, show.author, show.chapters, show.reviews, content.reviews.items.length]);

  const openExcerpt = useCallback(() => {
    if (hasExcerpt) {
      setExcerptOpen(true);
      track("excerpt_open");
    } else if (show.chapters) scrollToTarget("#chapters");
    else if (show.book) scrollToTarget("#about-book");
  }, [hasExcerpt, show.chapters, show.book]);

  const closeExcerpt = useCallback(() => setExcerptOpen(false), []);

  return (
    <div className="relative bg-void">
      <Preloader logo={content.brand.logo} />
      <Starfield />
      <CursorGlow />
      <ScrollChrome />
      <Header logo={content.brand.logo} brand={content.brand.name} nav={nav} retailer={retailer} />

      <main id="main">
        <Hero hero={content.hero} announcement={show.announcement ? content.announcement : undefined} retailer={retailer} onExcerpt={openExcerpt} />
        {show.book && <BookIntro book={content.book} bookTitle={content.hero.title} retailer={retailer} showAuthorLink={show.author} />}
        {show.marquee && content.marquee.items.length > 0 && <ThemeMarquee items={content.marquee.items} />}
        {show.explores && <Explores explores={content.explores} />}
        {show.author && <Author author={content.author} />}
        {show.chapters && <Chapters chapters={content.chapters} retailer={retailer} hasExcerpt={hasExcerpt} onExcerpt={openExcerpt} />}
        {show.manifesto && content.manifesto.quote && <Manifesto manifesto={content.manifesto} />}
        {show.impact && <Impact impact={content.impact} />}
        {show.reviews && <Reviews reviews={content.reviews} />}
        {show.buy && <Buy buy={content.buy} />}
      </main>

      <Footer footer={content.footer} logo={content.brand.logo} brand={content.brand.name} nav={nav} />
      <MobileBuyBar retailer={retailer} title={content.hero.title} />
      <ExcerptModal open={excerptOpen} onClose={closeExcerpt} title={content.excerpt.title} body={content.excerpt.body} retailer={retailer} />
    </div>
  );
}

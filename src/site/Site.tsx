import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { track } from "../lib/analytics";
import { useStore } from "../lib/store";
import { contentStore } from "../data/stores";
import Cursor from "./components/Cursor";
import ExcerptModal from "./components/ExcerptModal";
import Header, { type NavItem } from "./components/Header";
import Preloader from "./components/Preloader";
import Author from "./sections/Author";
import Book from "./sections/Book";
import Contents from "./sections/Contents";
import Footer from "./sections/Footer";
import Hero from "./sections/Hero";
import Impact from "./sections/Impact";
import Interlude from "./sections/Interlude";
import Journey from "./sections/Journey";
import Threads from "./sections/Threads";
import Voices from "./sections/Voices";
import { primaryRetailer } from "./buy";
import { scrollToTarget, setLenis } from "./smooth";

export default function Site() {
  const content = useStore(contentStore);
  const { sections: show } = content;
  const retailer = primaryRetailer(content.buy.retailers);
  const hasExcerpt = content.excerpt.body.trim().length > 0;
  const [excerptOpen, setExcerptOpen] = useState(false);
  const progress = useRef<HTMLDivElement>(null);

  // smooth scrolling on GSAP's clock, so pinned scenes and Lenis never disagree
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
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

  // late images change heights; re-measure the pinned scenes when they arrive
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    let t: ReturnType<typeof setTimeout>;
    const onImg = (e: Event) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        clearTimeout(t);
        t = setTimeout(refresh, 250);
      }
    };
    document.addEventListener("load", onImg, true);
    const bar = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => {
      window.removeEventListener("load", refresh);
      document.removeEventListener("load", onImg, true);
      clearTimeout(t);
      bar.kill();
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
      { id: "home", label: "Threshold" },
      show.book && { id: "about-book", label: "The Book" },
      show.explores && { id: "explores", label: "Threads" },
      show.author && { id: "author", label: "Author" },
      show.chapters && { id: "chapters", label: "Contents" },
      show.reviews && content.reviews.items.length > 0 && { id: "reviews", label: "Voices" },
      show.buy && { id: "buy", label: "Buy" },
    ];
    return items.filter(Boolean) as NavItem[];
  }, [show.book, show.explores, show.author, show.chapters, show.reviews, show.buy, content.reviews.items.length]);

  const openExcerpt = useCallback(() => {
    if (hasExcerpt) {
      setExcerptOpen(true);
      track("excerpt_open");
    } else if (show.chapters) scrollToTarget("#chapters");
    else if (show.book) scrollToTarget("#about-book");
  }, [hasExcerpt, show.chapters, show.book]);
  const closeExcerpt = useCallback(() => setExcerptOpen(false), []);

  return (
    <div className="site relative">
      <Preloader />
      <Cursor />
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div ref={progress} className="h-full origin-left scale-x-0 bg-ember" />
      </div>
      <Header nav={nav} retailer={retailer} />

      <main id="main">
        <Hero hero={content.hero} announcement={show.announcement ? content.announcement : undefined} retailer={retailer} onExcerpt={openExcerpt} />
        {show.book && <Book book={content.book} booksImage={content.hero.booksImage} retailer={retailer} showAuthorLink={show.author} />}
        {show.explores && <Threads explores={content.explores} />}
        {show.author && <Author author={content.author} />}
        {show.chapters && <Contents chapters={content.chapters} retailer={retailer} hasExcerpt={hasExcerpt} onExcerpt={openExcerpt} />}
        {show.manifesto && content.manifesto.quote && <Interlude manifesto={content.manifesto} />}
        {show.impact && <Impact impact={content.impact} />}
        {show.reviews && <Voices reviews={content.reviews} />}
        {show.buy && <Journey buy={content.buy} />}
      </main>

      <Footer footer={content.footer} nav={nav} brand={content.brand.name} />
      <ExcerptModal open={excerptOpen} onClose={closeExcerpt} title={content.excerpt.title} body={content.excerpt.body} retailer={retailer} />
    </div>
  );
}

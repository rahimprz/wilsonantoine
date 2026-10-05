import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { track } from "../lib/analytics";
import { useStore } from "../lib/store";
import { contentStore } from "../data/stores";
import ExcerptModal from "./components/ExcerptModal";
import Header, { type NavItem } from "./components/Header";
import MobileBuyBar from "./components/MobileBuyBar";
import AboutBook from "./sections/AboutBook";
import Author from "./sections/Author";
import Discover from "./sections/Discover";
import Footer from "./sections/Footer";
import ForWhom from "./sections/ForWhom";
import GetCopy from "./sections/GetCopy";
import Hero from "./sections/Hero";
import Inside from "./sections/Inside";
import Premise from "./sections/Premise";
import Reviews from "./sections/Reviews";
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
      show.book && { id: "about-book", label: "The Book" },
      show.chapters && { id: "chapters", label: "Inside" },
      show.author && { id: "author", label: "The Author" },
      show.reviews && content.reviews.items.length > 0 && { id: "reviews", label: "Reviews" },
      show.buy && { id: "buy", label: "Get the Book" },
    ];
    return items.filter(Boolean) as NavItem[];
  }, [show.book, show.author, show.chapters, show.reviews, show.buy, content.reviews.items.length]);

  const openExcerpt = useCallback(() => {
    if (hasExcerpt) {
      setExcerptOpen(true);
      track("excerpt_open");
    } else if (show.chapters) scrollToTarget("#chapters");
    else if (show.book) scrollToTarget("#about-book");
  }, [hasExcerpt, show.chapters, show.book]);
  const closeExcerpt = useCallback(() => setExcerptOpen(false), []);

  const cover = content.book.cover;
  const authorName = `${content.author.name}${/\bMD\b/.test(content.author.name) ? "" : ", MD"}`;

  return (
    <div className="site relative">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div ref={progress} className="h-full origin-left scale-x-0 bg-gold" />
      </div>
      <Header nav={nav} retailer={retailer} logo={content.brand.logo} brand={content.brand.name} />

      <main id="main">
        <Hero content={content} retailer={retailer} onExcerpt={openExcerpt} showAnnouncement={show.announcement} />
        {show.book && <AboutBook book={content.book} booksImage={content.hero.booksImage} title={content.hero.title} retailer={retailer} />}
        {show.explores && <Discover explores={content.explores} />}
        {show.chapters && <Inside chapters={content.chapters} cover={cover} retailer={retailer} hasExcerpt={hasExcerpt} onExcerpt={openExcerpt} />}
        {show.author && <Author author={content.author} />}
        {show.impact && <ForWhom impact={content.impact} />}
        {show.manifesto && content.manifesto.quote && <Premise manifesto={content.manifesto} />}
        {show.reviews && <Reviews reviews={content.reviews} />}
        {show.buy && <GetCopy buy={content.buy} title={content.hero.title} author={authorName} cover={cover} />}
      </main>

      <div className="pt-24 md:pt-32" />
      <Footer footer={content.footer} nav={nav} logo={content.brand.logo} brand={content.brand.name} />
      <MobileBuyBar retailer={retailer} title={content.hero.title} />
      <ExcerptModal open={excerptOpen} onClose={closeExcerpt} title={content.excerpt.title} body={content.excerpt.body} retailer={retailer} />
    </div>
  );
}

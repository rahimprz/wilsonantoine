import { useCallback, useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import { gsap, prefersReducedMotion, ScrollTrigger } from "../lib/gsap";
import { track } from "../lib/analytics";
import { useStore } from "../lib/store";
import { contentStore } from "../data/stores";
import BackToTop from "./components/BackToTop";
import ExcerptModal from "./components/ExcerptModal";
import Header, { type NavItem } from "./components/Header";
import MobileBuyBar from "./components/MobileBuyBar";
import Author from "./sections/Author";
import Begin from "./sections/Begin";
import Explores from "./sections/Explores";
import Faq from "./sections/Faq";
import Footer from "./sections/Footer";
import Hero from "./sections/Hero";
import Inside from "./sections/Inside";
import Quote from "./sections/Quote";
import Reviews from "./sections/Reviews";
import TheBook from "./sections/TheBook";
import { primaryRetailer } from "./buy";
import { scrollToTarget, setLenis } from "./smooth";

export default function Site() {
  const content = useStore(contentStore);
  const { sections: show } = content;
  const retailer = primaryRetailer(content.buy.retailers);
  const hasExcerpt = content.excerpt.body.trim().length > 0;
  const [excerptOpen, setExcerptOpen] = useState(false);

  // gentle smooth scrolling, on GSAP's clock so scroll-triggered reveals stay in step
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1 });
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

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => window.removeEventListener("load", refresh);
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
      show.book && { id: "about-book", label: "The Book" },
      show.chapters && { id: "chapters", label: "Inside" },
      show.author && { id: "author", label: "Author" },
      show.reviews && content.reviews.items.length > 0 && { id: "reviews", label: "Reviews" },
      show.faq && content.faq.items.length > 0 && { id: "faq", label: "FAQ" },
      { id: "contact", label: "Contact" },
    ];
    return items.filter(Boolean) as NavItem[];
  }, [show.book, show.chapters, show.author, show.reviews, show.faq, content.reviews.items.length, content.faq.items.length]);

  const openExcerpt = useCallback(() => {
    if (hasExcerpt) {
      setExcerptOpen(true);
      track("excerpt_open");
    } else if (show.chapters) scrollToTarget("#chapters");
    else if (show.book) scrollToTarget("#about-book");
  }, [hasExcerpt, show.chapters, show.book]);
  const closeExcerpt = useCallback(() => setExcerptOpen(false), []);

  const authorName = `${content.author.name}${/\bMD\b/.test(content.author.name) ? "" : ", MD"}`;
  const wordmark = content.author.name.replace(/^Dr\.?\s+/i, "");
  const credentials = content.author.credentials.replace(/\s*·\s*/g, " • ");

  return (
    <div className="site relative">
      <Header nav={nav} name={wordmark} credentials={credentials} />
      <main id="main">
        <Hero content={content} retailer={retailer} onExcerpt={openExcerpt} />
        {show.book && (
          <TheBook
            book={content.book}
            title={content.hero.title}
            author={authorName}
            formats={[...new Set(content.buy.retailers.filter((r) => r.url).map((r) => r.format))]}
            chapterCount={content.chapters.items.length}
            heroImage={content.hero.booksImage}
            retailer={retailer}
          />
        )}
        {show.chapters && <Inside chapters={content.chapters} retailer={retailer} hasExcerpt={hasExcerpt} onExcerpt={openExcerpt} />}
        {show.explores && <Explores explores={content.explores} />}
        {show.manifesto && content.manifesto.quote && <Quote manifesto={content.manifesto} />}
        {show.author && <Author author={content.author} />}
        {show.reviews && <Reviews reviews={content.reviews} />}
        {show.faq && <Faq faq={content.faq} />}
        {show.buy && <Begin buy={content.buy} title={content.hero.title} author={authorName} image={content.impact.image} />}
      </main>
      <Footer footer={content.footer} nav={nav} name={wordmark} credentials={credentials} />
      <MobileBuyBar retailer={retailer} title={content.hero.title} />
      <BackToTop />
      <ExcerptModal open={excerptOpen} onClose={closeExcerpt} title={content.excerpt.title} body={content.excerpt.body} retailer={retailer} />
    </div>
  );
}

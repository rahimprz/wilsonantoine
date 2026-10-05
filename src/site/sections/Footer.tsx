import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { track } from "../../lib/analytics";
import { uid } from "../../lib/id";
import { resolveMedia } from "../../lib/media";
import { subscribersStore } from "../../data/stores";
import type { SiteContent } from "../../data/types";
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from "../components/Icons";
import type { NavItem } from "../components/Header";
import { scrollToTarget } from "../smooth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FooterProps {
  footer: SiteContent["footer"];
  logo: string;
  brand: string;
  nav: NavItem[];
}

export default function Footer({ footer, logo, brand, nav }: FooterProps) {
  const root = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
  const [logoFailed, setLogoFailed] = useState(false);
  const socials = (Object.entries(footer.socials) as [SocialKey, string][]).filter(([, url]) => url.trim());

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-wordmark]",
          { yPercent: 60, opacity: 0 },
          { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 85%", end: "bottom bottom", scrub: 1 } },
        );
        gsap.fromTo("[data-wordmark]", { backgroundPosition: "100% 50%" }, { backgroundPosition: "0% 50%", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true } });
      });
    },
    { scope: root },
  );

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      return;
    }
    if (!subscribersStore.get().some((s) => s.email.toLowerCase() === value)) {
      subscribersStore.set((prev) => [...prev, { id: uid("sub_"), email: value, name: "", source: "website", date: new Date().toISOString() }]);
      track("subscribe");
    }
    setStatus("done");
    setEmail("");
  };

  return (
    <footer ref={root} className="relative z-10 overflow-hidden border-t border-white/5 bg-[linear-gradient(180deg,#070c22,#03050d)] pt-20 md:pt-28">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[70%] -translate-x-1/2 rounded-full bg-royal/20 blur-[120px]" />
      <div className="container-site relative grid gap-14 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.2fr]">
        <div>
          {!logoFailed ? (
            <img src={resolveMedia(logo)} alt={brand} className="h-16 w-auto" loading="lazy" onError={() => setLogoFailed(true)} />
          ) : (
            <p className="font-display text-xl text-white">{brand}</p>
          )}
          <p className="mt-6 max-w-sm font-serif text-xl text-mist italic">{footer.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-8 flex gap-3">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    aria-label={SOCIAL_LABELS[key]}
                    className="grid h-11 w-11 place-items-center rounded-full bg-[#a79576] text-void transition-all duration-500 hover:-translate-y-1 hover:bg-white"
                  >
                    <SocialIcon name={key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {footer.email && (
            <a href={`mailto:${footer.email}`} className="mt-6 inline-flex items-center gap-2 text-mist transition hover:text-gold">
              <Mail className="h-4 w-4" /> {footer.email}
            </a>
          )}
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Explore</p>
          <ul className="mt-6 space-y-3">
            {nav.map((n) => (
              <li key={n.id}>
                <button onClick={() => scrollToTarget(`#${n.id}`)} className="group inline-flex items-center gap-2 text-white/80 transition hover:text-white">
                  <span className="h-px w-0 bg-gold transition-all duration-500 group-hover:w-5" />
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">Newsletter</p>
          <p className="mt-6 font-display text-2xl font-semibold text-white">{footer.newsletterHeading}</p>
          <p className="mt-3 text-mist">{footer.newsletterText}</p>
          {status === "done" ? (
            <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-gold/40 bg-gold/10 px-5 py-3 text-gold-light" role="status">
              <Check className="h-5 w-5" /> Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} className="mt-6" noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className={`flex rounded-full border bg-white/5 p-1.5 transition focus-within:border-gold ${status === "error" ? "border-red-400/70" : "border-white/15"}`}>
                <input
                  id="newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 bg-transparent px-4 text-white placeholder:text-white/35 focus:outline-none"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                />
                <button type="submit" className="btn btn-gold !px-5 !py-3 !text-[0.75rem]">
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {status === "error" && (
                <p id="newsletter-error" className="mt-2 pl-4 text-sm text-red-300">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="relative mt-20 overflow-hidden px-4 select-none" aria-hidden>
        <p
          data-wordmark
          className="text-center font-display text-[13.5vw] leading-[0.9] font-bold whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgba(181,159,120,0.35)] [background:linear-gradient(90deg,rgba(181,159,120,0.0)_0%,rgba(181,159,120,0.55)_50%,rgba(181,159,120,0.0)_100%)] [background-size:200%_100%] bg-clip-text"
        >
          ANTOINE
        </p>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-sm text-white/60 md:flex-row">
          <p>
            © {new Date().getFullYear()} <strong className="font-semibold text-white">{footer.copyright.split(".")[0]}</strong>
            {footer.copyright.includes(".") ? `.${footer.copyright.split(".").slice(1).join(".")}` : ""}
          </p>
          <button onClick={() => scrollToTarget(0)} className="transition hover:text-gold">
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}

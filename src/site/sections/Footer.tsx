import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { track } from "../../lib/analytics";
import { uid } from "../../lib/id";
import { subscribersStore } from "../../data/stores";
import type { SiteContent } from "../../data/types";
import { SOCIAL_LABELS, type SocialKey } from "../components/Icons";
import type { NavItem } from "../components/Header";
import { scrollToTarget } from "../smooth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Footer({ footer, nav, brand }: { footer: SiteContent["footer"]; nav: NavItem[]; brand: string }) {
  const root = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
  const socials = (Object.entries(footer.socials) as [SocialKey, string][]).filter(([, url]) => url.trim());
  const word = brand.replace(/\bMD\b/i, "").trim().split(/\s+/).pop() || "Antoine";

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-letter]", {
          yPercent: 100,
          stagger: 0.05,
          ease: "none",
          scrollTrigger: { trigger: "[data-wordmark]", start: "top bottom", end: "bottom bottom", scrub: 0.8 },
        });
      });
    },
    { scope: root },
  );

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) return setStatus("error");
    if (!subscribersStore.get().some((s) => s.email.toLowerCase() === value)) {
      subscribersStore.set((prev) => [...prev, { id: uid("sub_"), email: value, name: "", source: "website", date: new Date().toISOString() }]);
      track("subscribe");
    }
    setStatus("done");
    setEmail("");
  };

  return (
    <footer ref={root} className="relative overflow-hidden bg-ink pt-24 text-ivory md:pt-32">
      <div className="wrap grid gap-16 lg:grid-cols-[7fr_5fr]">
        <div>
          <p className="label text-[0.65rem] text-sand">Newsletter</p>
          <h2 className="display mt-6 text-[clamp(3rem,7vw,7rem)]">{footer.newsletterHeading}</h2>
          <p className="mt-4 max-w-md text-sand">{footer.newsletterText}</p>
          {status === "done" ? (
            <p className="display mt-10 text-3xl text-dawn italic" role="status">
              Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} noValidate className="mt-10 max-w-xl">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className={`flex items-end gap-4 border-b pb-3 transition-colors focus-within:border-dawn ${status === "error" ? "border-red-400" : "border-ivory/30"}`}>
                <input
                  id="newsletter-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="your@email.com"
                  className="display min-w-0 flex-1 bg-transparent text-[clamp(1.6rem,3vw,2.4rem)] text-ivory placeholder:text-ivory/25 focus:outline-none"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                />
                <button type="submit" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ember text-ivory transition hover:bg-dawn hover:text-ink" aria-label="Subscribe">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              {status === "error" && (
                <p id="newsletter-error" className="mt-3 text-sm text-red-300">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>

        <div className="grid grid-cols-2 gap-10 self-end">
          <nav aria-label="Footer">
            <p className="label text-[0.65rem] text-sand">Index</p>
            <ul className="mt-5 space-y-2.5">
              {nav.map((n) => (
                <li key={n.id}>
                  <button onClick={() => scrollToTarget(`#${n.id}`)} className="text-ivory/80 transition hover:text-dawn">
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="label text-[0.65rem] text-sand">Elsewhere</p>
            <ul className="mt-5 space-y-2.5">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener" className="text-ivory/80 transition hover:text-dawn">
                    {SOCIAL_LABELS[key]} ↗
                  </a>
                </li>
              ))}
              {footer.email && (
                <li>
                  <a href={`mailto:${footer.email}`} className="text-ivory/80 transition hover:text-dawn">
                    Email ↗
                  </a>
                </li>
              )}
              {!socials.length && !footer.email && <li className="display text-xl text-sand italic">{footer.tagline}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div data-wordmark className="mt-20 overflow-hidden px-2 select-none" aria-hidden>
        <p className="display flex justify-center text-[clamp(6rem,27vw,30rem)] leading-[0.78]">
          {word.split("").map((ch, i) => (
            <span key={i} data-letter className={`inline-block ${i % 2 ? "italic text-dawn" : ""}`}>
              {ch}
            </span>
          ))}
        </p>
      </div>

      <div className="border-t border-ivory/10">
        <div className="wrap label flex flex-col items-center justify-between gap-3 py-6 text-[0.62rem] text-sand md:flex-row">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <button onClick={() => scrollToTarget(0)} className="inline-flex items-center gap-2 transition hover:text-ivory">
            Back to the threshold <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}

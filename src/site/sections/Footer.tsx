import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, Check, Mail } from "lucide-react";
import { track } from "../../lib/analytics";
import { uid } from "../../lib/id";
import { resolveMedia } from "../../lib/media";
import { subscribersStore } from "../../data/stores";
import type { SiteContent } from "../../data/types";
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from "../components/Icons";
import type { NavItem } from "../components/Header";
import Ornament from "../components/Ornament";
import Stars from "../components/Stars";
import { scrollToTarget } from "../smooth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FooterProps {
  footer: SiteContent["footer"];
  nav: NavItem[];
  name: string;
  credentials: string;
  logo: string;
}

/** His original footer, refined: centred quill logo, the newsletter pill, links, gold socials. */
export default function Footer({ footer, nav, name, credentials, logo }: FooterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
  const [logoOk, setLogoOk] = useState(true);
  const socials = (Object.entries(footer.socials) as [SocialKey, string][]).filter(([, url]) => url.trim());
  const logoUrl = resolveMedia(logo);

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
    <footer id="contact" className="relative isolate overflow-hidden border-t border-gold/20 bg-[linear-gradient(180deg,#2a3663_0%,#141d45_45%,#0a1015_100%)]">
      <Stars className="absolute inset-0 -z-10 h-full w-full" density={12000} gold={0.2} />
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(181,159,120,0.22),transparent)]" />

      <div className="wrap flex flex-col items-center pt-20 pb-10 text-center md:pt-24">
        {logoUrl && logoOk ? (
          <img src={logoUrl} alt={name} loading="lazy" onError={() => setLogoOk(false)} className="h-16 w-auto md:h-20" />
        ) : (
          <p className="font-[family-name:var(--font-heading)] text-[1.6rem] font-semibold tracking-[0.06em] text-star uppercase">{name}</p>
        )}
        <p className="caps mt-4 text-[0.58rem] text-gold-light">{credentials}</p>
        <p className="mt-4 max-w-md font-[family-name:var(--font-heading)] text-[1.2rem] text-star/80 italic">{footer.tagline}</p>
        <Ornament center className="mt-8" />

        <div className="mt-10 w-full max-w-xl">
          <p className="serif-head text-[clamp(1.8rem,3vw,2.4rem)]">{footer.newsletterHeading}</p>
          <p className="mt-2 text-mist">{footer.newsletterText}</p>
          {status === "done" ? (
            <p className="mt-6 inline-flex items-center gap-2 text-gold-light" role="status">
              <Check className="h-5 w-5" /> Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} noValidate className="mt-6">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className={`flex items-center gap-2 rounded-full border bg-white/[0.06] p-1.5 pl-5 backdrop-blur transition-colors focus-within:border-gold ${status === "error" ? "border-red-400" : "border-white/20"}`}>
                <Mail className="h-4 w-4 shrink-0 text-gold" />
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
                  placeholder="Your email address"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-star placeholder:text-haze focus:outline-none"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                />
                <button type="submit" className="btn-gold !rounded-full !px-5 !py-3 !text-[0.62rem]">
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {status === "error" && (
                <p id="newsletter-error" className="mt-2 text-sm text-red-300">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>

        <nav aria-label="Footer" className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {nav.map((n) => (
            <button key={n.id} onClick={() => scrollToTarget(`#${n.id}`)} className="caps text-[0.62rem] text-mist transition hover:text-gold-light">
              {n.label}
            </button>
          ))}
        </nav>

        {(socials.length > 0 || footer.email) && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {socials.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener" aria-label={SOCIAL_LABELS[key]} className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 text-gold transition hover:-translate-y-0.5 hover:bg-gold hover:text-night">
                <SocialIcon name={key} />
              </a>
            ))}
            {footer.email && (
              <a href={`mailto:${footer.email}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-gold-light transition hover:bg-gold hover:text-night">
                <Mail className="h-4 w-4" /> {footer.email}
              </a>
            )}
          </div>
        )}
      </div>

      <p aria-hidden className="pointer-events-none -mb-[0.18em] text-center font-[family-name:var(--font-heading)] text-[clamp(2.6rem,8.6vw,9rem)] leading-none font-semibold tracking-[0.02em] whitespace-nowrap text-white/[0.04] uppercase select-none">
        {name.replace(/,?\s+MD$/i, "")}
      </p>

      <div className="relative border-t border-white/10 bg-[#0a1015]/70">
        <div className="wrap flex flex-col items-center justify-between gap-3 py-6 text-[0.9rem] text-haze sm:flex-row">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <div className="flex items-center gap-6">
            <a href="/admin" className="caps text-[0.56rem] transition hover:text-gold-light">
              Admin
            </a>
            <button onClick={() => scrollToTarget(0)} className="caps inline-flex items-center gap-1.5 text-[0.56rem] transition hover:text-gold-light">
              Back to top <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { track } from "../../lib/analytics";
import { uid } from "../../lib/id";
import { resolveMedia } from "../../lib/media";
import { subscribersStore } from "../../data/stores";
import type { SiteContent } from "../../data/types";
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from "../components/Icons";
import type { NavItem } from "../components/Header";
import { scrollToTarget } from "../smooth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Footer({ footer, nav, logo, brand }: { footer: SiteContent["footer"]; nav: NavItem[]; logo: string; brand: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
  const [logoFailed, setLogoFailed] = useState(false);
  const socials = (Object.entries(footer.socials) as [SocialKey, string][]).filter(([, url]) => url.trim());

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
    <footer className="on-dark relative bg-[#070e26] text-white">
      {/* newsletter band */}
      <div className="wrap -translate-y-1/2">
        <div className="grid items-center gap-6 rounded-[28px] bg-gradient-to-br from-gold-light via-[#d6b77a] to-gold-deep p-8 text-navy shadow-2xl md:grid-cols-[1fr_1.1fr] md:p-12">
          <div>
            <h2 className="title text-[clamp(2rem,3.6vw,3rem)]">{footer.newsletterHeading}</h2>
            <p className="mt-2 text-navy/75">{footer.newsletterText}</p>
          </div>
          {status === "done" ? (
            <p className="flex items-center gap-3 rounded-full bg-navy px-6 py-4 font-medium text-gold-light" role="status">
              <Check className="h-5 w-5" /> Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} noValidate>
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className={`flex rounded-full bg-white p-1.5 shadow-inner ring-2 ${status === "error" ? "ring-red-500" : "ring-transparent"}`}>
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
                  className="min-w-0 flex-1 bg-transparent px-4 text-navy placeholder:text-navy/40 focus:outline-none"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                />
                <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-2">
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {status === "error" && (
                <p id="newsletter-error" className="mt-2 pl-4 text-sm font-medium text-red-800">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="wrap -mt-6 grid gap-10 pb-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          {!logoFailed ? (
            <img src={resolveMedia(logo)} alt={brand} className="h-14 w-auto" loading="lazy" onError={() => setLogoFailed(true)} />
          ) : (
            <p className="title text-2xl">{brand}</p>
          )}
          <p className="mt-4 max-w-xs text-white/60">{footer.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-light uppercase">Explore</p>
          <ul className="mt-4 space-y-2">
            {nav.map((n) => (
              <li key={n.id}>
                <button onClick={() => scrollToTarget(`#${n.id}`)} className="text-white/70 transition hover:text-white">
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold-light uppercase">Connect</p>
          {socials.length > 0 && (
            <ul className="mt-4 flex gap-2.5">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener" aria-label={SOCIAL_LABELS[key]} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-navy">
                    <SocialIcon name={key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {footer.email && (
            <a href={`mailto:${footer.email}`} className="mt-4 inline-flex items-center gap-2 text-white/70 hover:text-white">
              <Mail className="h-4 w-4" /> {footer.email}
            </a>
          )}
          {!socials.length && !footer.email && <p className="mt-4 text-white/50">Follow along for news about the book.</p>}
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="wrap py-6 text-center text-sm text-white/50">
          © {new Date().getFullYear()} {footer.copyright}
        </p>
      </div>
    </footer>
  );
}

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Feather, Mail } from "lucide-react";
import { track } from "../../lib/analytics";
import { uid } from "../../lib/id";
import { subscribersStore } from "../../data/stores";
import type { SiteContent } from "../../data/types";
import { SOCIAL_LABELS, SocialIcon, type SocialKey } from "../components/Icons";
import type { NavItem } from "../components/Header";
import { scrollToTarget } from "../smooth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Footer({ footer, nav, name, credentials }: { footer: SiteContent["footer"]; nav: NavItem[]; name: string; credentials: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "done">("idle");
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
    <footer id="contact" className="border-t border-line bg-parchment-2">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.3fr_0.7fr_1.2fr] md:py-20">
        <div>
          <p className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-[1.4rem] font-semibold tracking-[0.04em] text-ink-navy uppercase">
            {name} <Feather className="h-5 w-5 text-gold" strokeWidth={1.6} />
          </p>
          <p className="caps mt-1 text-[0.6rem] text-muted">{credentials}</p>
          <p className="mt-5 max-w-xs text-[1.1rem] italic">{footer.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener" aria-label={SOCIAL_LABELS[key]} className="grid h-10 w-10 place-items-center rounded-full border border-ink-navy/20 text-ink-navy transition hover:border-gold hover:bg-gold hover:text-white">
                    <SocialIcon name={key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
          {footer.email && (
            <a href={`mailto:${footer.email}`} className="mt-5 inline-flex items-center gap-2 text-ink-navy hover:text-gold-deep">
              <Mail className="h-4 w-4" /> {footer.email}
            </a>
          )}
        </div>

        <nav aria-label="Footer">
          <p className="caps text-[0.66rem] text-gold-deep">Explore</p>
          <ul className="mt-4 space-y-2">
            {nav.map((n) => (
              <li key={n.id}>
                <button onClick={() => scrollToTarget(`#${n.id}`)} className="text-ink-soft transition hover:text-ink-navy">
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="caps text-[0.66rem] text-gold-deep">Newsletter</p>
          <p className="serif-head mt-3 text-[1.8rem]">{footer.newsletterHeading}</p>
          <p className="mt-2">{footer.newsletterText}</p>
          {status === "done" ? (
            <p className="mt-5 inline-flex items-center gap-2 text-ink-navy" role="status">
              <Check className="h-5 w-5 text-gold" /> Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={subscribe} noValidate className="mt-5">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className={`flex border bg-parchment ${status === "error" ? "border-red-500" : "border-line"} focus-within:border-ink-navy`}>
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
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-ink-navy placeholder:text-muted focus:outline-none"
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                />
                <button type="submit" className="btn-solid !px-5 !py-3">
                  Subscribe <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {status === "error" && (
                <p id="newsletter-error" className="mt-2 text-sm text-red-700">
                  Please enter a valid email address.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col items-center justify-between gap-2 py-6 text-[0.95rem] text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <a href="/admin" className="caps text-[0.6rem] hover:text-ink-navy">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}

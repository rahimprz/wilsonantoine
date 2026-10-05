import { useState } from "react";
import { Check, Link2, Mail } from "lucide-react";
import { SocialIcon } from "./Icons";

/** Lets readers pass the book on: WhatsApp, Facebook, X, email, or copy the link. */
export default function ShareBook({ title, author }: { title: string; author: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin : "https://wilsonantoine.com";
  const text = `${title} by ${author}`;
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} — ${url}`)}`, icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg> },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: <SocialIcon name="facebook" /> },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, icon: <SocialIcon name="x" /> },
    { label: "Email", href: `mailto:?subject=${enc(text)}&body=${enc(`I thought you might like this book: ${text} — ${url}`)}`, icon: <Mail className="h-4 w-4" /> },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-white/60">Share the book:</span>
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener" aria-label={`Share on ${l.label}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-gold hover:text-navy">
          {l.icon}
        </a>
      ))}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm text-white transition hover:bg-gold hover:text-navy"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ExternalLink, ImageOff, Plus, RotateCcw, Save, Star, Trash2, Undo2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { resolveMedia, videoSources } from "../../lib/media";
import { uid } from "../../lib/id";
import { FORMATS } from "../../data/constants";
import { DEFAULT_CONTENT } from "../../data/defaultContent";
import { contentStore } from "../../data/stores";
import type { SectionKey, SiteContent, ThemeIcon } from "../../data/types";
import { THEME_ICONS } from "../../site/components/Icons";
import { Badge, Button, Card, Field, IconButton, Input, PageHeader, Select, Textarea, Toggle, useFeedback } from "../ui";

type TabKey = "layout" | "hero" | "book" | "explores" | "author" | "chapters" | "manifesto" | "impact" | "reviews" | "buy" | "excerpt" | "footer" | "seo";

const TABS: { key: TabKey; label: string; section?: SectionKey }[] = [
  { key: "layout", label: "Sections & brand" },
  { key: "hero", label: "Hero" },
  { key: "book", label: "About the book", section: "book" },
  { key: "explores", label: "Themes", section: "explores" },
  { key: "author", label: "Author", section: "author" },
  { key: "chapters", label: "Chapters", section: "chapters" },
  { key: "manifesto", label: "Quote", section: "manifesto" },
  { key: "impact", label: "Why it matters", section: "impact" },
  { key: "reviews", label: "Reviews", section: "reviews" },
  { key: "buy", label: "Buy links", section: "buy" },
  { key: "excerpt", label: "Excerpt" },
  { key: "footer", label: "Footer & social" },
  { key: "seo", label: "Search & sharing" },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  announcement: "Announcement pill (hero)",
  book: "About the book",
  marquee: "Themes ribbon",
  explores: "What this book explores",
  author: "Meet the author",
  chapters: "Featured chapters",
  manifesto: "Full-screen quote",
  impact: "Why this book matters",
  reviews: "Reader reviews",
  buy: "Begin the journey (buy)",
};

export default function Website() {
  const saved = useStore(contentStore);
  const { toast, confirm } = useFeedback();
  const [draft, setDraft] = useState<SiteContent>(saved);
  const [tab, setTab] = useState<TabKey>("hero");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // a save from another tab replaces an untouched draft
  useEffect(() => {
    if (!dirty) setDraft(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const patch = <K extends keyof SiteContent>(key: K, value: Partial<SiteContent[K]>) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] as object), ...value } as SiteContent[K] }));

  const publish = () => {
    contentStore.set(draft);
    toast("Published — the website now shows your changes");
  };
  const discard = async () => {
    if (await confirm({ title: "Discard unsaved changes?", confirmLabel: "Discard", danger: true })) setDraft(saved);
  };
  const resetSection = async (key: keyof SiteContent, label: string) => {
    if (await confirm({ title: `Restore “${label}” to the original?`, body: "Puts back the original wording and images for this section. Nothing is published until you save.", confirmLabel: "Restore" })) {
      setDraft((d) => ({ ...d, [key]: structuredClone(DEFAULT_CONTENT[key]) }));
      toast("Section restored in your draft", "info");
    }
  };

  const current = TABS.find((t) => t.key === tab)!;
  const sectionToggle = current.section && (
    <Card className="mb-4 p-4">
      <Toggle
        checked={draft.sections[current.section]}
        onChange={(v) => patch("sections", { [current.section!]: v })}
        label="Show this section on the website"
        description={draft.sections[current.section] ? undefined : "Hidden — visitors won't see it, and it drops out of the menu."}
      />
    </Card>
  );
  const resetKey: keyof SiteContent | null = tab === "layout" ? null : tab === "explores" ? "explores" : (tab as keyof SiteContent);

  return (
    <div className="pb-24">
      <PageHeader
        title="Website"
        subtitle="Edit what visitors see. Changes stay a draft until you publish."
        actions={
          <>
            <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-star transition hover:border-white/25">
              <ExternalLink className="h-4 w-4" /> View site
            </a>
            <Button variant="primary" onClick={publish} disabled={!dirty}>
              <Save className="h-4 w-4" /> Publish
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Website sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm transition ${
                tab === t.key ? "bg-gold/15 font-medium text-gold-light" : "text-mist hover:bg-white/[0.05] hover:text-star"
              }`}
            >
              {t.label}
              {t.section && !draft.sections[t.section] && <Badge className="!text-[0.65rem]">Hidden</Badge>}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {sectionToggle}
          <Card className="p-5 md:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-white">{current.label}</h2>
              {resetKey && (
                <Button size="sm" variant="ghost" onClick={() => resetSection(resetKey, current.label)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Restore original
                </Button>
              )}
            </div>
            <div className="space-y-5">
              {tab === "layout" && (
                <>
                  <Group title="Brand">
                    <Text label="Name" value={draft.brand.name} onChange={(v) => patch("brand", { name: v })} />
                    <ImageInput label="Logo" value={draft.brand.logo} original={DEFAULT_CONTENT.brand.logo} onChange={(v) => patch("brand", { logo: v })} />
                  </Group>
                  <Group title="Sections on the page">
                    {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
                      <Toggle key={k} checked={draft.sections[k]} onChange={(v) => patch("sections", { [k]: v })} label={SECTION_LABELS[k]} />
                    ))}
                  </Group>
                  <Group title="Announcement pill" hint="The small banner above the books in the hero.">
                    <Text label="Message" value={draft.announcement.text} onChange={(v) => patch("announcement", { text: v })} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Text label="Button label" value={draft.announcement.linkLabel} onChange={(v) => patch("announcement", { linkLabel: v })} />
                      <Text label="Link" value={draft.announcement.link} onChange={(v) => patch("announcement", { link: v })} hint="#buy scrolls to the buy section; a full URL opens it." />
                    </div>
                  </Group>
                  <Group title="Themes ribbon" hint="The two crossing bands of words below “About the book”.">
                    <StringList items={draft.marquee.items} onChange={(items) => patch("marquee", { items })} addLabel="Add phrase" />
                  </Group>
                </>
              )}

              {tab === "hero" && (
                <>
                  <Text label="Title" value={draft.hero.title} onChange={(v) => patch("hero", { title: v })} />
                  <Text label="Subtitle" value={draft.hero.subtitle} onChange={(v) => patch("hero", { subtitle: v })} />
                  <Text label="Byline (small italic line)" value={draft.hero.eyebrow} onChange={(v) => patch("hero", { eyebrow: v })} hint="Leave empty to hide." />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Outline button" value={draft.hero.primaryCta} onChange={(v) => patch("hero", { primaryCta: v })} hint="Opens the excerpt, or scrolls to chapters." />
                    <Text label="Gold button" value={draft.hero.secondaryCta} onChange={(v) => patch("hero", { secondaryCta: v })} hint="Goes to the main buy link." />
                  </div>
                  <ImageInput label="Books image" value={draft.hero.booksImage} original={DEFAULT_CONTENT.hero.booksImage} onChange={(v) => patch("hero", { booksImage: v })} />
                  <ImageInput label="Background photo" value={draft.hero.backgroundImage} original={DEFAULT_CONTENT.hero.backgroundImage} onChange={(v) => patch("hero", { backgroundImage: v })} />
                  <VideoInput label="Background video (loops over the photo)" value={draft.hero.backgroundVideo} original={DEFAULT_CONTENT.hero.backgroundVideo} onChange={(v) => patch("hero", { backgroundVideo: v })} />
                </>
              )}

              {tab === "book" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.book.eyebrow} onChange={(v) => patch("book", { eyebrow: v })} />
                    <Text label="Heading" value={draft.book.heading} onChange={(v) => patch("book", { heading: v })} />
                  </div>
                  <Text label="Description" multiline value={draft.book.body} onChange={(v) => patch("book", { body: v })} hint="The book's title is set in italics automatically." />
                  <Group title="Highlights (check list)">
                    <StringList items={draft.book.bullets} onChange={(bullets) => patch("book", { bullets })} addLabel="Add highlight" />
                  </Group>
                  <Text label="Button label" value={draft.book.ctaLabel} onChange={(v) => patch("book", { ctaLabel: v })} />
                  <ImageInput label="Image" value={draft.book.image} original={DEFAULT_CONTENT.book.image} onChange={(v) => patch("book", { image: v })} />
                  <ImageInput label="Flat front cover (optional)" value={draft.book.cover} original={DEFAULT_CONTENT.book.cover} onChange={(v) => patch("book", { cover: v })} />
                  <p className="-mt-3 text-xs text-haze">A straight-on image of just the front cover (no mockup). When set, the 3D book on the site shows it; when empty, the cover is drawn to match.</p>
                </>
              )}

              {tab === "explores" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.explores.eyebrow} onChange={(v) => patch("explores", { eyebrow: v })} />
                    <Text label="Heading" value={draft.explores.heading} onChange={(v) => patch("explores", { heading: v })} />
                  </div>
                  <Text label="Intro" value={draft.explores.intro} onChange={(v) => patch("explores", { intro: v })} />
                  <ImageInput label="Centre image" value={draft.explores.image} original={DEFAULT_CONTENT.explores.image} onChange={(v) => patch("explores", { image: v })} />
                  <ImageInput label="Background (Earth)" value={draft.explores.backgroundImage} original={DEFAULT_CONTENT.explores.backgroundImage} onChange={(v) => patch("explores", { backgroundImage: v })} />
                  <Group title="Theme cards" hint="Shown three on each side of the book. An even number looks best.">
                    <ItemList
                      items={draft.explores.themes}
                      onChange={(themes) => patch("explores", { themes })}
                      create={() => ({ id: uid("t"), title: "New theme", text: "", icon: "sparkles" as ThemeIcon })}
                      addLabel="Add theme"
                      render={(t, set) => (
                        <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                          <Text label="Title" value={t.title} onChange={(v) => set({ title: v })} />
                          <Field label="Icon">
                            {(id) => (
                              <Select id={id} value={t.icon} onChange={(e) => set({ icon: e.target.value as ThemeIcon })}>
                                {Object.keys(THEME_ICONS).map((k) => (
                                  <option key={k}>{k}</option>
                                ))}
                              </Select>
                            )}
                          </Field>
                          <Text label="Line" value={t.text} onChange={(v) => set({ text: v })} className="sm:col-span-2" />
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "author" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.author.eyebrow} onChange={(v) => patch("author", { eyebrow: v })} />
                    <Text label="Name" value={draft.author.name} onChange={(v) => patch("author", { name: v })} />
                  </div>
                  <Text label="Credentials" value={draft.author.credentials} onChange={(v) => patch("author", { credentials: v })} />
                  <Text label="Biography" multiline value={draft.author.bio} onChange={(v) => patch("author", { bio: v })} />
                  <ImageInput label="Portrait" value={draft.author.image} original={DEFAULT_CONTENT.author.image} onChange={(v) => patch("author", { image: v })} />
                  <Group title="Highlights" hint="Plain numbers like “30+” count up as they scroll into view.">
                    <ItemList
                      items={draft.author.highlights}
                      onChange={(highlights) => patch("author", { highlights })}
                      create={() => ({ id: uid("h"), value: "", label: "" })}
                      addLabel="Add highlight"
                      render={(h, set) => (
                        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                          <Text label="Value" value={h.value} onChange={(v) => set({ value: v })} />
                          <Text label="Label" value={h.label} onChange={(v) => set({ label: v })} />
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "chapters" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.chapters.eyebrow} onChange={(v) => patch("chapters", { eyebrow: v })} />
                    <Text label="Heading" value={draft.chapters.heading} onChange={(v) => patch("chapters", { heading: v })} />
                  </div>
                  <ImageInput label="Image" value={draft.chapters.image} original={DEFAULT_CONTENT.chapters.image} onChange={(v) => patch("chapters", { image: v })} />
                  <Group title="Chapters">
                    <ItemList
                      items={draft.chapters.items}
                      onChange={(items) => patch("chapters", { items })}
                      create={() => ({ id: uid("c"), title: "New chapter", summary: "" })}
                      addLabel="Add chapter"
                      numbered
                      render={(c, set) => (
                        <div className="space-y-3">
                          <Text label="Title" value={c.title} onChange={(v) => set({ title: v })} />
                          <Text label="Summary" multiline value={c.summary} onChange={(v) => set({ summary: v })} />
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "manifesto" && (
                <>
                  <Text label="Small heading" value={draft.manifesto.eyebrow} onChange={(v) => patch("manifesto", { eyebrow: v })} />
                  <Text label="Quote" multiline value={draft.manifesto.quote} onChange={(v) => patch("manifesto", { quote: v })} hint="Words light up one by one as visitors scroll. Keep it to one or two lines." />
                  <VideoInput label="Background video" value={draft.manifesto.video} original={DEFAULT_CONTENT.manifesto.video} onChange={(v) => patch("manifesto", { video: v })} />
                </>
              )}

              {tab === "impact" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.impact.eyebrow} onChange={(v) => patch("impact", { eyebrow: v })} />
                    <Text label="Heading" value={draft.impact.heading} onChange={(v) => patch("impact", { heading: v })} />
                  </div>
                  <Text label="Text" multiline value={draft.impact.body} onChange={(v) => patch("impact", { body: v })} />
                  <ImageInput label="Image" value={draft.impact.image} original={DEFAULT_CONTENT.impact.image} onChange={(v) => patch("impact", { image: v })} />
                  <Group title="Pillars">
                    <ItemList
                      items={draft.impact.pillars}
                      onChange={(pillars) => patch("impact", { pillars })}
                      create={() => ({ id: uid("p"), title: "", text: "" })}
                      addLabel="Add pillar"
                      render={(p, set) => (
                        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                          <Text label="Title" value={p.title} onChange={(v) => set({ title: v })} />
                          <Text label="Line" value={p.text} onChange={(v) => set({ text: v })} />
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "reviews" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.reviews.eyebrow} onChange={(v) => patch("reviews", { eyebrow: v })} />
                    <Text label="Heading" value={draft.reviews.heading} onChange={(v) => patch("reviews", { heading: v })} />
                  </div>
                  <Group title="Reviews" hint="Use real reader reviews, with their permission.">
                    <ItemList
                      items={draft.reviews.items}
                      onChange={(items) => patch("reviews", { items })}
                      create={() => ({ id: uid("r"), name: "", quote: "", rating: 5 })}
                      addLabel="Add review"
                      render={(r, set) => (
                        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                          <Text label="Reader name" value={r.name} onChange={(v) => set({ name: v })} />
                          <Field label="Rating">
                            {(id) => (
                              <Select id={id} value={r.rating} onChange={(e) => set({ rating: Number(e.target.value) })}>
                                {[5, 4, 3, 2, 1].map((n) => (
                                  <option key={n} value={n}>
                                    {"★".repeat(n)}
                                  </option>
                                ))}
                              </Select>
                            )}
                          </Field>
                          <Text label="Review" multiline value={r.quote} onChange={(v) => set({ quote: v })} className="sm:col-span-2" />
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "buy" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Small heading" value={draft.buy.eyebrow} onChange={(v) => patch("buy", { eyebrow: v })} />
                    <Text label="Heading" value={draft.buy.heading} onChange={(v) => patch("buy", { heading: v })} />
                  </div>
                  <Text label="Line" value={draft.buy.body} onChange={(v) => patch("buy", { body: v })} />
                  <VideoInput label="Background video" value={draft.buy.video} original={DEFAULT_CONTENT.buy.video} onChange={(v) => patch("buy", { video: v })} />
                  <Group title="Where to buy" hint="The starred link powers every “Buy” button on the site. Clicks on each are counted in the dashboard.">
                    <ItemList
                      items={draft.buy.retailers}
                      onChange={(retailers) => patch("buy", { retailers })}
                      create={() => ({ id: uid("ret"), label: "", format: "Paperback", url: "", price: "", primary: draft.buy.retailers.length === 0 })}
                      addLabel="Add store / format"
                      render={(r, set, all, setAll) => (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Text label="Store" value={r.label} onChange={(v) => set({ label: v })} placeholder="Amazon, Barnes & Noble…" />
                          <Field label="Format">
                            {(id) => (
                              <Select id={id} value={r.format} onChange={(e) => set({ format: e.target.value })}>
                                {[...FORMATS, "Other"].map((f) => (
                                  <option key={f}>{f}</option>
                                ))}
                              </Select>
                            )}
                          </Field>
                          <Text label="Link" value={r.url} onChange={(v) => set({ url: v })} className="sm:col-span-2" placeholder="https://" />
                          <Text label="Price (optional)" value={r.price} onChange={(v) => set({ price: v })} placeholder="$9.99" />
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              variant={r.primary ? "primary" : "secondary"}
                              onClick={() => setAll(all.map((x) => ({ ...x, primary: x.id === r.id })))}
                              className="w-full"
                            >
                              <Star className={`h-3.5 w-3.5 ${r.primary ? "fill-current" : ""}`} /> {r.primary ? "Main buy link" : "Make main link"}
                            </Button>
                          </div>
                        </div>
                      )}
                    />
                  </Group>
                </>
              )}

              {tab === "excerpt" && (
                <>
                  <p className="rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-sm text-gold-light">
                    Paste a passage you're happy to share free — the opening pages work well. While this is empty, “Read an Excerpt” scrolls visitors to the chapter previews instead.
                  </p>
                  <Text label="Excerpt title" value={draft.excerpt.title} onChange={(v) => patch("excerpt", { title: v })} placeholder="e.g. Chapter One" />
                  <Text label="Excerpt text" multiline rows={14} value={draft.excerpt.body} onChange={(v) => patch("excerpt", { body: v })} hint="Leave a blank line between paragraphs." />
                </>
              )}

              {tab === "footer" && (
                <>
                  <Text label="Tagline" value={draft.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Newsletter heading" value={draft.footer.newsletterHeading} onChange={(v) => patch("footer", { newsletterHeading: v })} />
                    <Text label="Contact email (optional)" value={draft.footer.email} onChange={(v) => patch("footer", { email: v })} />
                  </div>
                  <Text label="Newsletter text" value={draft.footer.newsletterText} onChange={(v) => patch("footer", { newsletterText: v })} />
                  <Group title="Social links" hint="Icons only appear for links you fill in.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(Object.keys(draft.footer.socials) as (keyof SiteContent["footer"]["socials"])[]).map((k) => (
                        <Text
                          key={k}
                          label={{ facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", x: "X (Twitter)" }[k]}
                          value={draft.footer.socials[k]}
                          placeholder="https://"
                          onChange={(v) => patch("footer", { socials: { ...draft.footer.socials, [k]: v } })}
                        />
                      ))}
                    </div>
                  </Group>
                  <Text label="Copyright line" value={draft.footer.copyright} onChange={(v) => patch("footer", { copyright: v })} hint="The current year is added automatically." />
                </>
              )}

              {tab === "seo" && (
                <>
                  <Text label="Page title" value={draft.seo.title} onChange={(v) => patch("seo", { title: v })} hint={`${draft.seo.title.length} / 60 characters — shown in browser tabs and Google results.`} />
                  <Text label="Description" multiline rows={3} value={draft.seo.description} onChange={(v) => patch("seo", { description: v })} hint={`${draft.seo.description.length} / 160 characters — the snippet under the title in search results.`} />
                  <div className="rounded-xl border border-white/[0.07] bg-white p-4">
                    <p className="truncate text-[0.8rem] text-[#202124]">wilsonantoine.com</p>
                    <p className="truncate text-lg text-[#1a0dab]">{draft.seo.title}</p>
                    <p className="line-clamp-2 text-sm text-[#4d5156]">{draft.seo.description}</p>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* sticky publish bar */}
      <div inert={!dirty} aria-hidden={!dirty} className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-500 lg:left-64 ${dirty ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 border-t border-gold/30 bg-[#0e1430]/95 px-4 py-3 backdrop-blur md:px-8">
          <p className="flex items-center gap-2 text-sm text-gold-light">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gold" /> Unsaved changes
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={discard}>
              <Undo2 className="h-4 w-4" /> Discard
            </Button>
            <Button variant="primary" onClick={publish}>
              <Save className="h-4 w-4" /> Publish changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- field helpers

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-2xl border border-white/[0.07] p-4 md:p-5">
      <legend className="px-2 text-sm font-semibold text-star">{title}</legend>
      {hint && <p className="-mt-2 text-xs text-haze">{hint}</p>}
      {children}
    </fieldset>
  );
}

function Text({
  label,
  value,
  onChange,
  multiline,
  rows,
  hint,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) =>
        multiline ? (
          <Textarea id={id} value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={rows ? { minHeight: rows * 26 } : undefined} />
        ) : (
          <Input id={id} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        )
      }
    </Field>
  );
}

function ImageInput({ label, value, original, onChange }: { label: string; value: string; original: string; onChange: (v: string) => void }) {
  const url = resolveMedia(value);
  const [failedUrl, setFailedUrl] = useState("");
  const failed = failedUrl === url;
  return (
    <Field label={label} hint={value === original ? "Original image" : <button type="button" className="text-gold hover:underline" onClick={() => onChange(original)}>Use the original image</button>}>
      {(id) => (
        <div className="flex gap-3">
          <div className="grid h-[52px] w-[72px] shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-[repeating-conic-gradient(#141b3d_0_25%,#0e1430_0_50%)] bg-[length:12px_12px]">
            {url && !failed ? <img src={url} alt="" className="h-full w-full object-contain" onError={() => setFailedUrl(url)} /> : <ImageOff className="h-4 w-4 text-haze" />}
          </div>
          <Input id={id} value={value.startsWith("media:") ? url : value} placeholder="https://… image URL" onChange={(e) => onChange(e.target.value === resolveMedia(original) ? original : e.target.value)} />
        </div>
      )}
    </Field>
  );
}

function VideoInput({ label, value, original, onChange }: { label: string; value: string; original: string; onChange: (v: string) => void }) {
  const { sources, poster } = videoSources(value);
  return (
    <Field
      label={label}
      hint={
        value === original ? (
          "Original looping video. Paste an .mp4 or .webm link to use your own, or clear it for no video."
        ) : (
          <button type="button" className="text-gold hover:underline" onClick={() => onChange(original)}>
            Use the original video
          </button>
        )
      }
    >
      {(id) => (
        <div className="flex gap-3">
          <div className="h-[52px] w-[92px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
            {sources.length > 0 && (
              <video key={value} muted loop autoPlay playsInline poster={poster} className="h-full w-full object-cover">
                {sources.map((s) => (
                  <source key={s.src} src={s.src} type={s.type} />
                ))}
              </video>
            )}
          </div>
          <Input id={id} value={value} placeholder="https://… .mp4" onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </Field>
  );
}

function StringList({ items, onChange, addLabel }: { items: string[]; onChange: (v: string[]) => void; addLabel: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Item ${i + 1}`} />
          <IconButton label="Move up" disabled={i === 0} onClick={() => onChange(swap(items, i, i - 1))}>
            <ArrowUp className="h-4 w-4" />
          </IconButton>
          <IconButton label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))} className="hover:!text-red-300">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const next = [...arr];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function ItemList<T extends { id: string }>({
  items,
  onChange,
  create,
  render,
  addLabel,
  numbered,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  create: () => T;
  render: (item: T, set: (p: Partial<T>) => void, all: T[], setAll: (v: T[]) => void) => ReactNode;
  addLabel: string;
  numbered?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider text-haze uppercase">{numbered ? `Chapter ${i + 1}` : `#${i + 1}`}</span>
            <div className="flex">
              <IconButton label="Move up" disabled={i === 0} onClick={() => onChange(swap(items, i, i - 1))}>
                <ArrowUp className="h-4 w-4" />
              </IconButton>
              <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => onChange(swap(items, i, i + 1))}>
                <ArrowDown className="h-4 w-4" />
              </IconButton>
              <IconButton label="Remove" onClick={() => onChange(items.filter((x) => x.id !== item.id))} className="hover:!text-red-300">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          {render(item, (p) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...p } : x))), items, onChange)}
        </div>
      ))}
      <Button size="sm" onClick={() => onChange([...items, create()])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

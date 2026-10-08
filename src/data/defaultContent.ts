import type { SiteContent } from "./types";

/**
 * Everything on the public site, as it ships. The admin's Website editor saves changes on top of
 * this (see stores.ts), so new fields added here always appear even after content was edited.
 *
 * Image values starting with "media:" resolve against the current WordPress uploads folder
 * (see lib/media.ts), so moving the images to this site later is one setting, not a content edit.
 */
export const DEFAULT_CONTENT: SiteContent = {
  seo: {
    title: "Postmortem Life Continuation — Dr. Wilson Antoine, MD",
    description:
      "Compelling evidence that life does not end at death. A medical doctor with over three decades of clinical experience explores dreams, signs, and real events that point to life beyond the grave.",
  },
  brand: { name: "Wilson Antoine MD", logo: "/books/logo.webp" },
  announcement: {
    text: "Postmortem Life Continuation is available now on Kindle",
    linkLabel: "Get your copy",
    link: "#buy",
  },
  hero: {
    eyebrow: "Medicine. Faith. Lived Experience.",
    title: "Postmortem Life Continuation",
    subtitle: "Compelling Evidence That Life Does Not End at Death",
    primaryCta: "Read an Excerpt",
    secondaryCta: "Buy the Book",
    booksImage: "/books/books-fan.webp",
    backgroundImage: "media:view-universe-space-shot-milky-way-galaxy-scaled.webp",
    backgroundVideo: "/videos/nebula-drift.mp4",
  },
  book: {
    eyebrow: "The Book",
    heading: "About the Book",
    body: "A powerful exploration of life beyond death, Postmortem Life Continuation presents real-life experiences, medical insights, and profound reflections that challenge conventional beliefs about human existence. Through documented events, dreams, and unexplained phenomena, Dr. Wilson Antoine offers compelling evidence that life continues beyond physical death.",
    bullets: [
      "Based on real medical and personal experiences",
      "Explores the concept of multiphasic life",
      "Blends science, spirituality, and philosophy",
    ],
    image: "/books/books-hardcover.webp",
    ctaLabel: "Know About Author",
    // a flat image of the front cover (optional) — when set, the 3D books wear it
    cover: "/books/cover.webp",
  },
  marquee: {
    items: [
      "Life After Death",
      "Divine Signs & Dreams",
      "Human Purpose & Mission",
      "Medical Perspectives",
      "Spiritual Evidence",
      "Hope Beyond Fear",
    ],
  },
  explores: {
    eyebrow: "What You'll Discover",
    heading: "What This Book Explores",
    intro: "Six threads run through the book — where medicine, faith, and lived experience meet.",
    image: "/books/book-tilted.webp",
    backgroundImage: "media:africa-madagascar-planet-earth-1-1-scaled.webp",
    themes: [
      { id: "t1", icon: "infinity", title: "Life After Death", text: "Documented events suggesting consciousness continues beyond the body." },
      { id: "t2", icon: "moon", title: "Divine Signs & Dreams", text: "Dreams and symbols that revealed events before they happened." },
      { id: "t3", icon: "compass", title: "Human Purpose & Mission", text: "Life seen as a meaningful journey, each of us with a mission." },
      { id: "t4", icon: "stethoscope", title: "Medical Perspectives", text: "Three decades of clinical practice, examined through a doctor's eyes." },
      { id: "t5", icon: "feather", title: "Spiritual Evidence", text: "Encounters that point to an intelligent presence beyond what we see." },
      { id: "t6", icon: "sunrise", title: "Hope Beyond Fear", text: "Comfort for anyone who fears death or grieves someone they love." },
    ],
  },
  author: {
    eyebrow: "Meet the Author",
    name: "Dr. Wilson Antoine",
    credentials: "Medical Doctor · Author",
    bio: "Dr. Wilson Antoine is a medical doctor with over three decades of clinical experience. Through his professional journey and deeply personal encounters, he has witnessed events that challenge traditional views of life and death. This book is the result of years of reflection, investigation, and lived experience.",
    image: "media:fwefwefwe.png",
    highlights: [
      { id: "h1", value: "30+", label: "Years of clinical experience" },
      { id: "h2", value: "MD", label: "Practicing medical doctor" },
      { id: "h3", value: "5", label: "Featured chapters" },
    ],
  },
  chapters: {
    eyebrow: "Featured Chapters",
    heading: "Inside the Book",
    image: "/books/book-tilted.webp",
    items: [
      {
        id: "c1",
        title: "Divine Messages: Dreams & Destiny",
        summary:
          "This chapter explores powerful dreams that reveal future events before they happen. It examines how destiny can be communicated through symbolic visions, suggesting the presence of a higher guiding intelligence beyond human understanding.",
      },
      {
        id: "c2",
        title: "Between Two Worlds",
        summary:
          "A compelling look at moments where life and death appear to overlap. Through real experiences, this chapter highlights encounters that suggest human consciousness may continue beyond physical existence.",
      },
      {
        id: "c3",
        title: "Messages from the Edge of Life",
        summary:
          "Focusing on individuals near death, this chapter shares extraordinary moments where messages, visions, and awareness emerge at life's final threshold—pointing toward a deeper reality beyond the visible world.",
      },
      {
        id: "c4",
        title: "Guided by the Unseen",
        summary:
          "This chapter presents astonishing cases where unseen forces intervene to protect, warn, or guide individuals in real time, offering strong evidence of an invisible but intelligent presence at work.",
      },
      {
        id: "c5",
        title: "Proof of Life Beyond the Grave",
        summary:
          "Bringing together medical insight and personal testimony, this chapter builds a powerful argument that death is not the end. It presents evidence suggesting life continues in another phase after physical death.",
      },
    ],
  },
  manifesto: {
    eyebrow: "The Premise",
    quote: "Life is a meaningful journey — with a continuation beyond what we can see.",
    video: "/videos/rising-light.mp4",
  },
  impact: {
    eyebrow: "Readers Impact",
    heading: "Why This Book Matters",
    body: "This book offers comfort to those who fear death, clarity to those seeking purpose, and reassurance to anyone who has lost a loved one. It invites readers to see life as a meaningful journey with a continuation beyond what we can see.",
    image: "/books/books-pair.webp",
    pillars: [
      { id: "p1", title: "Comfort", text: "For those who fear death." },
      { id: "p2", title: "Clarity", text: "For those seeking purpose." },
      { id: "p3", title: "Reassurance", text: "For anyone who has lost a loved one." },
    ],
  },
  reviews: {
    eyebrow: "Reviews",
    heading: "What Readers Are Saying",
    items: [
      { id: "r1", name: "Michell J.", quote: "A deeply moving and thought-provoking book.", rating: 5 },
      { id: "r2", name: "Alina S.", quote: "It changed how I see life and death.", rating: 5 },
      { id: "r3", name: "Gold S.", quote: "A rare blend of medicine and spirituality.", rating: 5 },
    ],
  },
  buy: {
    eyebrow: "Your Copy",
    heading: "Begin the Journey",
    body: "Discover the evidence. Explore the truth. Embrace the continuation of life.",
    video: "/videos/light-tunnel.mp4",
    retailers: [
      {
        id: "amazon-kindle",
        label: "Amazon",
        format: "Kindle eBook",
        url: "https://www.amazon.com/POSTMORTEM-LIFE-CONTINUATION-COMPELLING-EVIDENCE-ebook/dp/B0G17TN9MR/ref=tmm_kin_swatch_0",
        price: "",
        primary: true,
      },
    ],
  },
  excerpt: {
    title: "",
    body: "",
  },
  faq: {
    eyebrow: "Questions",
    heading: "Before You Begin",
    items: [
      {
        id: "f1",
        q: "What is Postmortem Life Continuation about?",
        a: "It brings together real-life experiences, medical insight and personal reflection — documented events, dreams and unexplained phenomena — as compelling evidence that life continues beyond physical death.",
      },
      {
        id: "f2",
        q: "Who wrote it?",
        a: "Dr. Wilson Antoine, a medical doctor with over three decades of clinical experience. The book grew out of years of reflection, investigation and lived experience.",
      },
      {
        id: "f3",
        q: "Who is this book for?",
        a: "Anyone who fears death, anyone searching for purpose, and anyone who has lost someone they love — and every reader curious about where medicine, faith and experience meet.",
      },
      {
        id: "f4",
        q: "Where can I buy it?",
        a: "It's available now as a Kindle eBook on Amazon. Every “Buy” button on this page takes you straight there.",
      },
      {
        id: "f5",
        q: "Can I read a little first?",
        a: "Yes — open the featured chapters above for a summary of each, or use “Read sample” on the book's Amazon page.",
      },
    ],
  },
  footer: {
    tagline: "Compelling evidence that life does not end at death.",
    newsletterHeading: "Stay in the light",
    newsletterText: "News on the book, events, and new writing from Dr. Antoine. No spam, ever.",
    email: "",
    socials: { facebook: "", instagram: "", linkedin: "", youtube: "", x: "" },
    copyright: "Wilson Antoine. All Rights Reserved.",
  },
  sections: {
    announcement: true,
    book: true,
    marquee: true,
    explores: true,
    author: true,
    chapters: true,
    manifesto: true,
    impact: true,
    reviews: true,
    buy: true,
    faq: true,
  },
};

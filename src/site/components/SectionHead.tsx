import Ornament from "./Ornament";

interface SectionHeadProps {
  n?: number;
  eyebrow: string;
  title: string;
  intro?: string;
  center?: boolean;
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** Numeral · small caps · serif heading · quill ornament — the same opening for every section. */
export default function SectionHead({ n, eyebrow, title, intro, center = false }: SectionHeadProps) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <p data-reveal className={`caps flex items-center gap-3 text-gold ${center ? "justify-center" : ""}`}>
        {n != null && <span className="font-[family-name:var(--font-heading)] text-[1rem] tracking-normal italic normal-case">{ROMAN[n] ?? n}.</span>}
        {eyebrow}
      </p>
      <h2 data-reveal className="serif-head mt-4 text-[clamp(2.3rem,4.2vw,3.6rem)]">
        {title}
      </h2>
      <div data-reveal className="mt-6">
        <Ornament center={center} />
      </div>
      {intro && (
        <p data-reveal className="mt-6 text-[1.12rem] text-mist">
          {intro}
        </p>
      )}
    </div>
  );
}

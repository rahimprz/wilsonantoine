/**
 * The cover drawn in CSS — an arch of light on ink — used wherever a book photo can't load,
 * so a missing image never leaves a hole in the layout.
 */
export default function BookCover({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Postmortem Life Continuation, by Wilson Antoine, MD"
      className={`relative aspect-[2/3] overflow-hidden rounded-[3px] bg-ink text-ivory shadow-[0_40px_80px_-30px_rgba(15,13,10,0.7)] ${className}`}
    >
      <div className="absolute inset-y-0 left-0 w-[4%] bg-gradient-to-r from-black/60 to-transparent" />
      <div className="absolute inset-x-[22%] top-[24%] bottom-[22%] arch bg-[radial-gradient(70%_60%_at_50%_70%,#fff3dc_0%,#f3c98b_30%,#b85c27_62%,transparent_100%)] opacity-90" />
      <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[9%] text-center">
        <p className="display text-[clamp(0.9rem,2.4vw,1.7rem)] leading-[1.05]">
          Postmortem <em>Life</em>
          <br />
          Continuation
        </p>
        <p className="label text-[clamp(0.4rem,0.9vw,0.6rem)] opacity-80">Wilson Antoine, MD</p>
      </div>
    </div>
  );
}

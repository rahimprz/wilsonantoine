/** The mono section marker used throughout: "(02) — The Author". */
export default function Label({ n, children, className = "" }: { n?: string | number; children: string; className?: string }) {
  return (
    <p className={`label flex items-center gap-3 ${className}`}>
      {n != null && <span className="opacity-60">({String(n).padStart(2, "0")})</span>}
      <span className="h-px w-8 bg-current opacity-40" />
      <span>{children}</span>
    </p>
  );
}

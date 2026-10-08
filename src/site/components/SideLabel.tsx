/** The small rotated label on the edge of a panel ("THE BOOK", "THE AUTHOR"). */
export default function SideLabel({ children }: { children: string }) {
  return (
    <span aria-hidden className="caps pointer-events-none absolute top-14 left-5 hidden origin-top-left translate-y-full -rotate-90 text-[0.62rem] whitespace-nowrap text-muted lg:block">
      {children}
    </span>
  );
}

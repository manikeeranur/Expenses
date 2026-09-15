export default function Screen({ children, withNav = true, wide = false, className = "" }) {
  const width = wide
    ? "pb-8 md:pb-10"
    : withNav
    ? "pb-28 md:max-w-3xl md:pb-10"
    : "max-w-md pb-8 md:my-10 md:max-w-xl md:rounded-[2rem] md:border md:border-border md:shadow-xl md:shadow-black/5";

  return (
    <main className={`mx-auto min-h-dvh w-full bg-background ${width} ${className}`}>
      {children}
    </main>
  );
}

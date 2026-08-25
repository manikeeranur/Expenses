export default function Screen({ children, withNav = true, className = "" }) {
  const width = withNav
    ? "max-w-md pb-28 md:max-w-3xl md:pb-10 lg:max-w-5xl"
    : "max-w-md pb-8 md:my-10 md:rounded-[2rem] md:border md:border-border md:shadow-xl md:shadow-black/5";

  return (
    <main className={`mx-auto min-h-dvh w-full bg-background ${width} ${className}`}>
      {children}
    </main>
  );
}

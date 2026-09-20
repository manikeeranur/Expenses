export default function Screen({ children, withNav = true, wide = false, className = "" }) {
  const padding = withNav ? "pb-28 md:pb-10" : "pb-8 md:pb-10";
  const chrome = wide
    ? ""
    : withNav
    ? "md:max-w-3xl"
    : "max-w-md md:my-10 md:max-w-xl md:rounded-[2rem] md:border md:border-border md:shadow-xl md:shadow-black/5";

  return (
    <main className={`mx-auto min-h-dvh w-full bg-background ${padding} ${chrome} ${className}`}>
      {children}
    </main>
  );
}

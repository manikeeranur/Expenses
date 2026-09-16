export default function QrPattern({ seed = "upi", size = 160 }) {
  const cells = 14;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  function bit(i) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    return hash % 5 === 0 ? 0 : hash % 2;
  }

  const isFinder = (r, c) => (r < 3 && c < 3) || (r < 3 && c >= cells - 3) || (r >= cells - 3 && c < 3);

  return (
    <div
      className="grid rounded-xl bg-white p-3"
      style={{ width: size, height: size, gridTemplateColumns: `repeat(${cells}, 1fr)` }}
    >
      {Array.from({ length: cells * cells }).map((_, i) => {
        const r = Math.floor(i / cells);
        const c = i % cells;
        const on = isFinder(r, c) ? (r % 3 !== 1 || c % 3 !== 1 ? 1 : 0) : bit(i);
        return <span key={i} className={on ? "bg-black" : "bg-transparent"} />;
      })}
    </div>
  );
}

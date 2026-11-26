const STEPS = ["Genres", "Reading goal", "First book"];

export function Steps({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex gap-4 text-sm">
      {STEPS.map((label, i) => (
        <li key={label} className={i + 1 === current ? "font-semibold" : "text-neutral-400"}>
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

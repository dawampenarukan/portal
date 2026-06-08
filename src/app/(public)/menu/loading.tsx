export default function MenuLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-muted" />
        <div className="mx-auto mt-3 h-8 w-64 rounded-lg bg-muted" />
        <div className="mx-auto mt-2 h-4 w-96 max-w-full rounded bg-muted/70" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 shrink-0 rounded-full bg-muted" />
        ))}
      </div>
      <div className="mb-8 h-32 rounded-3xl bg-muted/60" />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/60" />
          ))}
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 rounded-xl bg-muted/60" />
          <div className="h-56 rounded-xl bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

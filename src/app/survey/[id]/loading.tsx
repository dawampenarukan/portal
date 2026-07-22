export default function SurveyFillLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6 px-4 py-8">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-72 max-w-full rounded bg-muted/70" />
      </div>
      <div className="space-y-4 rounded-2xl border bg-white/80 p-6">
        <div className="h-11 rounded-lg bg-muted/60" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="h-4 w-3/4 rounded bg-muted/60" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-11 w-11 rounded-full bg-muted/50" />
              ))}
            </div>
          </div>
        ))}
        <div className="h-11 w-40 rounded-full bg-muted/60" />
      </div>
    </div>
  );
}

const CARD_COUNT = 3;

function Bone({ className }: { className: string }) {
  return <span className={`ui-skeleton ${className}`} />;
}

export function FeedSkeleton() {
  return (
    <main
      className="mx-auto min-h-full w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pt-7"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only">記事を読み込んでいます</p>
      <div className="home-mast">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Bone className="h-9 w-36 rounded-[12px]" />
        <Bone className="h-11 w-40 rounded-full" />
      </div>
      <Bone className="mb-3 h-3 w-40 rounded-full" />
      <Bone className="h-14 w-4/5 max-w-md rounded-2xl sm:h-16" />
      <Bone className="mt-5 h-4 w-full max-w-lg rounded-full" />
      <Bone className="mt-2 h-4 w-3/5 max-w-sm rounded-full" />

        <div className="mt-8 rounded-[var(--radius-card)] border border-[var(--hairline)] bg-[var(--card)] p-4 sm:p-5">
          <Bone className="h-3 w-28 rounded-full" />
          <Bone className="mt-4 h-11 rounded-xl" />
          <Bone className="mt-4 h-11 w-48 rounded-full" />
          <Bone className="mt-4 h-11 rounded-xl" />
          <Bone className="mt-4 h-11 w-full max-w-xs rounded-full" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <Bone className="h-6 w-52 rounded-lg" />
        <Bone className="h-4 w-10 rounded-full" />
      </div>

      <div className="mt-5 grid gap-3">
        {Array.from({ length: CARD_COUNT }, (_, index) => (
          <article key={index} className="ui-article-row p-4 sm:p-5">
            <div className="mb-2.5 flex items-center justify-between gap-3 pl-2.5">
              <Bone className="h-6 w-24 rounded-full" />
              <Bone className="h-3.5 w-16 rounded-full" />
            </div>
            <Bone className="ml-2.5 h-6 w-[88%] rounded-lg" />
            <Bone className="mt-3 ml-2.5 h-4 w-full rounded-full" />
            <Bone className="mt-2 ml-2.5 h-4 w-2/3 rounded-full" />
            <Bone className="mt-4 ml-2.5 h-11 w-28 rounded-full" />
          </article>
        ))}
      </div>
    </main>
  );
}

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
      <div className="mb-8 flex items-center justify-between gap-3">
        <Bone className="h-9 w-36 rounded-[12px]" />
        <Bone className="h-11 w-40 rounded-full" />
      </div>
      <Bone className="mb-3 h-3 w-40 rounded-full" />
      <Bone className="h-14 w-4/5 max-w-md rounded-2xl sm:h-16" />
      <Bone className="mt-5 h-4 w-full max-w-lg rounded-full" />
      <Bone className="mt-2 h-4 w-3/5 max-w-sm rounded-full" />

      <div className="mt-10 border-y border-[var(--hairline)] py-4">
        <Bone className="h-12 rounded-2xl" />
        <Bone className="mt-3 h-12 rounded-xl" />
        <Bone className="mt-2 h-12 rounded-xl" />
        <Bone className="mt-2 h-12 rounded-xl" />
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

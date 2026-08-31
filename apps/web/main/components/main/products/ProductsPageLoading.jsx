import PagesTitle from '../cards/PagesTitle';

function Pulse({ className }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

function ProductCardSkeleton() {
  return (
    <div
      className="flex w-full flex-col rounded-xl border-2 border-[#E8E8E8] bg-white p-2.5 md:rounded-2xl md:p-3"
      aria-hidden="true"
    >
      <Pulse className="aspect-[4/3] w-full rounded-lg md:aspect-[230/170]" />
      <Pulse className="mt-2.5 h-4 w-[90%] md:mt-4 md:h-5" />
      <Pulse className="mt-1 h-3 w-1/2 md:h-4" />
    </div>
  );
}

function CategoryRowSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Pulse className="h-5 w-5 shrink-0 rounded-md" />
      <Pulse className="h-4 w-28" />
    </div>
  );
}

export default function ProductsPageLoading() {
  return (
    <div className="mx-auto max-w-7xl md:mt-10">
      <PagesTitle
        flushBottom
        alt="productsPageTitle"
        title={
          <p>
            فروشگاه آنلاین <span className="text-[#F4C111]">کودهای خانگی</span>
          </p>
        }
      />

      <div className="mx-3! my-10 flex flex-col gap-5 md:mx-auto md:max-w-7xl md:flex-row">
        <div className="flex gap-3 md:w-[280px] md:shrink-0 md:flex-col">
          <div className="hidden items-center justify-between rounded-lg bg-[#F4F4F4] px-3 py-2.5 md:flex">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-6 w-6 shrink-0 rounded-full" />
          </div>

          <div className="w-full">
            <div className="flex h-12 items-center justify-between rounded-t-lg bg-[#F4F4F4] px-2 md:px-4">
              <Pulse className="h-4 w-36" />
              <Pulse className="h-6 w-6 shrink-0 rounded-full" />
            </div>
            <div className="hidden flex-col gap-3 rounded-b-2xl bg-gray-200 px-5 py-3 md:flex">
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-5 hidden w-full items-center justify-between gap-5 text-nowrap md:flex">
            <p className="text-lg font-extrabold text-[#353535]">کودهای خانگی</p>
            <hr className="w-full border-dashed border-gray-400" />
            <div className="flex w-[200px] items-center rounded-lg bg-[#F4F4F4] p-3 py-[11px] md:py-3">
              <Pulse className="h-4 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>

          <div className="mt-8 mb-3 flex w-fit justify-self-end gap-2">
            <Pulse className="h-10 w-16 rounded-xl" />
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-10 w-10 rounded-lg" />
            <Pulse className="h-10 w-16 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

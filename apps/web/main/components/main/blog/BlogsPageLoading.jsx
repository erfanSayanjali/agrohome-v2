import PagesTitle from '../cards/PagesTitle';

function Pulse({ className }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

function BlogCardSkeleton() {
  return (
    <article className="w-full" aria-hidden="true">
      <div className="grid w-full grid-cols-[max-content_1fr] grid-rows-[repeat(4,max-content)] gap-1 rounded-2xl bg-gray-100 p-3 md:gap-3 md:p-5">
        <Pulse className="row-span-full ms-2 aspect-[2/1.5] w-[110px] self-center rounded-2xl md:h-[170px] md:w-[250px]" />
        <Pulse className="mt-1 h-5 w-3/4" />
        <Pulse className="mt-1 h-4 w-28" />
        <Pulse className="mt-1 h-4 w-full" />
        <Pulse className="mt-2 hidden h-8 w-28 justify-self-end rounded-full md:block" />
      </div>
    </article>
  );
}

function CategoryRowSkeleton() {
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <Pulse className="h-7 w-7 shrink-0 rounded-md" />
      <Pulse className="h-4 w-32" />
    </div>
  );
}

export default function BlogsPageLoading() {
  return (
    <div className="mt-0 min-h-screen max-w-7xl md:mx-3 md:my-10 lg:mx-auto">
      <PagesTitle
        imagePosition=""
        image="/b.jpg"
        alt="aboutUs"
        title={
          <p>
            وبلاگ <span className="text-[#F4C111]">آگروهوم</span>
          </p>
        }
      />
      <div className="mx-3 flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-col gap-3 md:w-[350px]">
          <div className="hidden items-center justify-between rounded-lg bg-[#F4F4F4] px-4 py-3 md:flex">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-6 w-6 shrink-0 rounded-full" />
          </div>
          <div className="rounded-2xl bg-[#F3F3F3] p-5 pt-0">
            <p className="border-b border-dashed py-4 font-extrabold">موضوعات وبلاگ</p>
            <div className="mt-3 flex flex-col gap-3">
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
              <CategoryRowSkeleton />
            </div>
          </div>
        </div>

        <div className="md:w-[calc(100%-350px)]">
          <div className="mb-5 flex w-full items-center justify-between gap-5 text-nowrap">
            <p className="text-lg font-extrabold text-[#353535]">مقالات</p>
            <hr className="border-dashed border-gray-400 md:w-full" />
            <div className="flex w-[140px] items-center rounded-lg bg-[#F4F4F4] p-3 py-[11px] md:w-[200px] md:py-3">
              <Pulse className="h-4 w-full" />
            </div>
          </div>

          <div className="flex w-full flex-wrap justify-between gap-6">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>

          <div className="mt-5 mb-2 flex w-fit justify-self-end gap-2">
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

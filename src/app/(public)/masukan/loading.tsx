import { PageHeaderSkeleton } from '@/components/ui/route-skeletons';

export default function MasukanLoading() {
  return (
    <div className='mx-auto max-w-2xl animate-pulse px-4 py-8'>
      <PageHeaderSkeleton />
      <div className='mt-6 space-y-4 rounded-2xl border bg-white/60 p-6'>
        <div className='h-5 w-40 rounded bg-muted' />
        <div className='h-4 w-64 rounded bg-muted' />
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='h-10 rounded-lg bg-muted' />
          <div className='h-10 rounded-lg bg-muted' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='h-10 rounded-lg bg-muted' />
          <div className='h-10 rounded-lg bg-muted' />
        </div>
        <div className='h-10 rounded-lg bg-muted' />
        <div className='h-28 rounded-lg bg-muted' />
        <div className='h-10 w-36 rounded-lg bg-muted' />
      </div>
    </div>
  );
}

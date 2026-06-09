import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  emoji: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionTitle({
  emoji,
  title,
  subtitle,
  href,
  linkLabel = 'Lihat semua',
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        'mb-5 flex flex-wrap items-end justify-between gap-3',
        className
      )}
    >
      <div>
        <h2 className='flex items-center gap-2 text-xl font-extrabold text-foreground md:text-2xl'>
          <span
            className='atm-section-badge flex h-10 w-10 items-center justify-center rounded-2xl text-xl'
            aria-hidden
          >
            {emoji}
          </span>
          {title}
        </h2>
        {subtitle && (
          <p className='mt-1 pl-12 text-sm text-muted-foreground'>{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className='rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground transition hover:bg-primary/15 hover:text-primary'
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

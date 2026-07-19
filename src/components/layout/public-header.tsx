'use client';

import Link from 'next/link';
import { BrandLogo } from '@/components/layout/brand-logo';
import {
  MenuOrganolepticNotices,
  type MenuOrganolepticNoticesData,
} from '@/components/layout/menu-organoleptic-notices';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { NAV_ITEMS, SITE_TAGLINE } from '@/lib/constants';
import { cn } from '@/lib/utils';

const HEAVY_PREFETCH_ROUTES = new Set(['/kinerja', '/menu']);

interface PublicHeaderProps {
  /** Hanya diisi untuk sesi full admin; pengunjung biasa = null. */
  organolepticNotices?: MenuOrganolepticNoticesData | null;
}

export function PublicHeader({ organolepticNotices = null }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3'>
        <Link href='/' className='flex items-center gap-3'>
          <BrandLogo size='md' priority />
          <p className='hidden max-w-[140px] text-xs font-medium leading-snug text-muted-foreground md:block'>
            {SITE_TAGLINE}
          </p>
        </Link>

        <nav className='hidden items-center gap-1 lg:flex'>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const pillClass = cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all',
              active
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-foreground/80 hover:bg-accent hover:text-primary'
            );

            if (item.href === '/menu' && organolepticNotices) {
              return (
                <div key={item.href} className={pillClass}>
                  <Link
                    href={item.href}
                    prefetch={!HEAVY_PREFETCH_ROUTES.has(item.href)}
                    className='flex items-center gap-1.5'
                  >
                    <span className='text-base' aria-hidden>
                      {item.emoji}
                    </span>
                    {item.label}
                  </Link>
                  <MenuOrganolepticNotices
                    notices={organolepticNotices}
                    tone='public'
                  />
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={!HEAVY_PREFETCH_ROUTES.has(item.href)}
                className={pillClass}
              >
                <span className='text-base' aria-hidden>
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className='flex items-center gap-2'>
          <Link
            href='/admin'
            prefetch={false}
            className='hidden rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-secondary hover:text-secondary-foreground md:inline-flex'
          >
            Admin
          </Link>
          <button
            type='button'
            className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary lg:hidden'
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label='Menu'
          >
            {mobileOpen ? (
              <X className='h-5 w-5' />
            ) : (
              <Menu className='h-5 w-5' />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className='border-t border-border bg-white px-4 py-3 lg:hidden'>
          <div className='flex flex-col gap-1'>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const rowClass = cn(
                'flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                active ? 'bg-primary text-white' : 'hover:bg-accent'
              );

              if (item.href === '/menu' && organolepticNotices) {
                return (
                  <div key={item.href} className={rowClass}>
                    <Link
                      href={item.href}
                      prefetch={!HEAVY_PREFETCH_ROUTES.has(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className='flex flex-1 items-center gap-2'
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </Link>
                    <MenuOrganolepticNotices
                      notices={organolepticNotices}
                      tone='public'
                    />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={!HEAVY_PREFETCH_ROUTES.has(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={rowClass}
                >
                  <span>{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
            <Link
              href='/admin'
              prefetch={false}
              onClick={() => setMobileOpen(false)}
              className='flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold hover:bg-accent'
            >
              <span>🔐</span>
              Admin
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}

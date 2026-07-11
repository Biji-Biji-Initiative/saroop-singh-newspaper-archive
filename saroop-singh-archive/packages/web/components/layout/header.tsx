'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNav } from '@/components/mobile/mobilenav';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';
import { HStack } from '@/components/layout/flexlayout';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/story', label: 'Story' },
  { href: '/articles', label: 'Articles' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/people', label: 'People' },
  { href: '/gallery', label: 'Photographs' },
  { href: '/remember', label: 'Remember' },
  { href: '/methodology', label: 'Archive Method' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200/40 sticky top-0 z-40 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.03)]">
      <ResponsiveContainer className="py-4 sm:py-5">
        <HStack justify="between" align="center">
          {/* Logo */}
          <Link 
            href="/" 
            className="group flex items-center gap-2"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-amber-300 blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-25" />
              <span className="relative font-serif text-xl font-bold text-[#17241d] sm:text-2xl">
                <span className="hidden sm:inline">Saroop Singh Archive</span>
                <span className="sm:hidden">SS Archive</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <li key={item.href} className="relative">
                  <Link 
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={cn(
                      'relative px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-300',
                      'hover:bg-neutral-100/80',
                      isActive(item.href)
                        ? 'text-amber-950'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    {isActive(item.href) && (
                      <div className="absolute inset-0 rounded-xl bg-amber-100" />
                    )}
                    <span className="relative">{item.label}</span>
                    {isActive(item.href) && (
                      <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-amber-700" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <MobileNav className="xl:hidden" />
        </HStack>
      </ResponsiveContainer>
    </header>
  );
}

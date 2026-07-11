'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MobileNav } from '@/components/mobile/mobilenav';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';
import { HStack } from '@/components/layout/flexlayout';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/restore', label: 'Restore Photos' },
  { href: '/gallery', label: 'Gallery' },
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <span className="relative text-xl sm:text-2xl font-bold bg-gradient-to-br from-neutral-800 to-neutral-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Saroop Singh Archive</span>
                <span className="sm:hidden">SS Archive</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:block">
            <ul className="flex items-center gap-1">
              {navigationItems.map((item) => (
                <li key={item.href} className="relative">
                  <Link 
                    href={item.href}
                    className={cn(
                      'relative px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-300',
                      'hover:bg-neutral-100/80',
                      isActive(item.href)
                        ? 'text-primary-600'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    {isActive(item.href) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-100 to-primary-50 rounded-xl" />
                    )}
                    <span className="relative">{item.label}</span>
                    {isActive(item.href) && (
                      <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <MobileNav className="sm:hidden" />
        </HStack>
      </ResponsiveContainer>
    </header>
  );
}

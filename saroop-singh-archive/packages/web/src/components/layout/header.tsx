'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileNav } from '@/components/mobile/mobilenav'
import { ResponsiveContainer } from '@/components/layout/responsivecontainer'
import { HStack } from '@/components/layout/flexlayout'
import { cn } from '@/lib/utils'

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Articles' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/contribute', label: 'Share a Memory' },
  { href: '/restore', label: 'Restore a Photo' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
]

export function Header() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname?.startsWith(path)) return true
    return false
  }

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/40 bg-white/80 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.03)] backdrop-blur-md">
      <ResponsiveContainer className="py-4 sm:py-5">
        <HStack justify="between" align="center">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="relative">
              <div className="from-primary-500 to-primary-600 absolute inset-0 rounded-lg bg-gradient-to-br opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-30" />
              <span className="relative bg-gradient-to-br from-neutral-800 to-neutral-600 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                <span className="hidden sm:inline">Saroop Singh Archive</span>
                <span className="sm:hidden">SS Archive</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navigationItems.map(item => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      'relative rounded-xl px-4 py-2.5 text-[15px] font-medium transition-all duration-300',
                      'hover:bg-neutral-100/80',
                      isActive(item.href)
                        ? 'text-primary-600'
                        : 'text-neutral-600 hover:text-neutral-900'
                    )}
                  >
                    {isActive(item.href) && (
                      <div className="from-primary-100 to-primary-50 absolute inset-0 rounded-xl bg-gradient-to-r" />
                    )}
                    <span className="relative">{item.label}</span>
                    {isActive(item.href) && (
                      <div className="from-primary-500 to-primary-400 absolute right-4 bottom-0 left-4 h-[2px] rounded-full bg-gradient-to-r" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Navigation */}
          <MobileNav className="lg:hidden" />
        </HStack>
      </ResponsiveContainer>
    </header>
  )
}

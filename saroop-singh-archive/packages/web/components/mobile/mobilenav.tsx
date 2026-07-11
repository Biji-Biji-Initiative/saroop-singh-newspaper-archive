'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, FileText, Clock, BookOpen, Image, User, Users, ChevronRight, LockKeyhole, ImagePlus, Sparkles, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useModalFocus } from '@/hooks/useModalFocus'

interface MobileNavProps {
  className?: string
}

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/story', label: 'Begin His Story', icon: Sparkles },
  { href: '/articles', label: 'Articles', icon: FileText },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/people', label: 'People', icon: Users },
  { href: '/gallery', label: 'Photographs', icon: Image },
  { href: '/remember', label: 'Family Memory Room', icon: Heart },
  { href: '/methodology', label: 'Archive Method', icon: BookOpen },
  { href: '/about', label: 'About', icon: User },
  { href: '/contribute', label: 'Add Photographs', icon: ImagePlus },
  { href: '/studio', label: 'Owner Studio', icon: LockKeyhole },
]

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const mounted = React.useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const pathname = usePathname()
  const drawerRef = useModalFocus<HTMLDivElement>(isOpen, () => setIsOpen(false))

  useEffect(() => {
    const closeForAnotherOverlay = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== 'navigation') setIsOpen(false)
    }
    window.addEventListener('archive:overlay-open', closeForAnotherOverlay)
    return () => window.removeEventListener('archive:overlay-open', closeForAnotherOverlay)
  }, [])

  // Prevent scroll when menu is open
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const openNavigation = () => {
    if (!isOpen) window.dispatchEvent(new CustomEvent('archive:overlay-open', { detail: 'navigation' }))
    setIsOpen(value => !value)
  }

  return (
    <>
      {/* Mobile Menu Button - Sophisticated Design */}
      <button
        onClick={openNavigation}
        className={cn(
          'xl:hidden relative p-3 rounded-2xl transition-all duration-300',
          'bg-white/90 backdrop-blur-md shadow-md border border-neutral-200/40',
          'hover:shadow-lg active:scale-95',
          isOpen && 'bg-[#17241d] shadow-lg shadow-black/10',
          className
        )}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        <div className="relative w-6 h-6">
          {isOpen ? (
            <X className="w-6 h-6 text-white animate-scale-in" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-700" />
          )}
        </div>
      </button>

      {mounted && isOpen && createPortal(<>
        <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-[100] bg-neutral-950/65 backdrop-blur-sm xl:hidden" onClick={() => setIsOpen(false)} />
        <div
          ref={drawerRef}
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
          'fixed inset-y-0 right-0 z-[101] h-[100dvh] w-[min(22rem,88vw)] xl:hidden',
          'bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'translate-x-0'
        )}
        >
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/60 via-transparent to-emerald-50/30" />
        
        {/* Menu Header */}
        <div className="relative border-b border-neutral-200/40 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold text-[#17241d]">
                Navigation
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Saroop Singh Archive</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100/80 transition-colors hover:bg-neutral-200/80"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Menu Items with Enhanced Styling */}
        <nav className="relative overflow-y-auto p-4 pb-28" style={{ maxHeight: 'calc(100dvh - 104px)' }}>
          <ul className="space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              const Icon = item.icon

              return (
                <li 
                  key={item.href}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={isOpen ? 'animate-fade-up' : ''}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center justify-between p-4 rounded-2xl',
                      'transition-all duration-300 group',
                      isActive
                        ? 'bg-amber-100 text-amber-950 font-medium shadow-sm'
                        : 'hover:bg-neutral-50 active:bg-neutral-100'
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-amber-700" />
                    )}
                    <div className="flex items-center gap-4 ml-2">
                      <div className={cn(
                        'p-2 rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-[#17241d] shadow-lg shadow-black/10'
                          : 'bg-neutral-100 group-hover:bg-neutral-200'
                      )}>
                        <Icon 
                          className={cn(
                            'w-5 h-5 transition-colors',
                            isActive ? 'text-white' : 'text-neutral-600'
                          )} 
                        />
                      </div>
                      <span className="text-[16px] font-medium">{item.label}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        'w-5 h-5 transition-all duration-300',
                        'group-hover:translate-x-1',
                        isActive ? 'text-amber-800' : 'text-neutral-400'
                      )} 
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Menu Footer with Premium Touch */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200/40 bg-white/95 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
          <p className="text-xs text-neutral-500 text-center font-medium">
            Preserving a family record from Malaya
          </p>
          <div className="mt-3 flex justify-center">
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i} 
                  className="h-1.5 w-1.5 rounded-full bg-amber-600"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
        </div>
      </>, document.body)}
    </>
  )
}

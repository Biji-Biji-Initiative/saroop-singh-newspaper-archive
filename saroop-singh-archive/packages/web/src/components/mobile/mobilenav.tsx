'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  FileText,
  Clock,
  Heart,
  Sparkles,
  Image,
  User,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  className?: string
}

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/articles', label: 'Articles', icon: FileText },
  { href: '/timeline', label: 'Timeline', icon: Clock },
  { href: '/contribute', label: 'Share a Memory', icon: Heart },
  { href: '/restore', label: 'Restore a Photo', icon: Sparkles },
  { href: '/gallery', label: 'Gallery', icon: Image },
  { href: '/about', label: 'About', icon: User },
]

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => setIsOpen(false), [pathname])

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => closeRef.current?.focus())

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      requestAnimationFrame(() => trigger?.focus())
    }
  }, [isOpen])

  const menu =
    isOpen && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="fixed inset-0 z-[100] bg-neutral-950/65 backdrop-blur-sm lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            <aside
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed inset-y-0 right-0 z-[101] flex h-[100dvh] h-screen w-[min(22rem,88vw)] flex-col overflow-hidden border-l border-neutral-200/60 bg-white shadow-2xl lg:hidden"
            >
              <header className="shrink-0 border-b border-neutral-200/60 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">
                      Navigation
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Saroop Singh Archive
                    </p>
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close navigation"
                    className="focus:ring-primary-300 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 focus:ring-4 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <ul className="space-y-2">
                  {navigationItems.map(item => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' &&
                        pathname.startsWith(`${item.href}/`))
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'relative flex min-h-14 items-center justify-between rounded-2xl p-3 transition-colors',
                            isActive
                              ? 'bg-primary-100 text-primary-800 font-semibold'
                              : 'text-neutral-800 hover:bg-neutral-100'
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl',
                                isActive
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-neutral-100 text-neutral-700'
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            {item.label}
                          </span>
                          <ChevronRight className="h-5 w-5 text-neutral-400" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              <footer className="shrink-0 border-t border-neutral-200/60 bg-neutral-50 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs font-medium text-neutral-500">
                Preserving Malaysian athletics history
              </footer>
            </aside>
          </>,
          document.body
        )
      : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(value => !value)}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200/60 bg-white/95 shadow-md backdrop-blur transition active:scale-95 lg:hidden',
          className
        )}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
      >
        <Menu className="h-6 w-6 text-neutral-700" />
      </button>
      {menu}
    </>
  )
}

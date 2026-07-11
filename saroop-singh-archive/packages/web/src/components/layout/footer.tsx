import Link from 'next/link';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';
import { VStack } from '@/components/layout/flexlayout';
import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-neutral-50 to-neutral-100 border-t border-neutral-200/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50/20 via-transparent to-transparent" />
      <ResponsiveContainer className="relative py-12 sm:py-16">
        <VStack gap="xl" align="center" className="text-center sm:text-left">
          {/* Main Footer Content */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {/* About Section */}
            <div className="space-y-4">
              <h3 className="text-[17px] font-semibold text-neutral-900">About the Archive</h3>
              <p className="text-[15px] text-neutral-600 leading-relaxed">
                Preserving the legacy of Saroop Singh, a pioneering Sikh athlete who shaped Malaysian athletics history.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-[17px] font-semibold text-neutral-900">Explore</h3>
              <nav className="space-y-3">
                <Link href="/articles" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    Historical Articles
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
                <Link href="/timeline" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    Timeline
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
                <Link href="/about" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    About
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="text-[17px] font-semibold text-neutral-900">Resources</h3>
              <nav className="space-y-3">
                <a href="#" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    Research Guidelines
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
                <a href="#" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    Citation Format
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
                <a href="#" className="group block text-[15px] text-neutral-600 hover:text-primary-600 transition-all duration-200">
                  <span className="relative">
                    Contact Us
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary-500 group-hover:w-full transition-all duration-300" />
                  </span>
                </a>
              </nav>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h3 className="text-[17px] font-semibold text-neutral-900">Connect</h3>
              <div className="space-y-3">
                <p className="text-[15px] text-neutral-600">
                  Contribute to preserving Malaysian sports history
                </p>
                <a 
                  href="mailto:info@saroopsingharchive.com" 
                  className="inline-block text-[15px] text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Submit Historical Materials →
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-neutral-200/60" />

          {/* Bottom Footer */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[14px] text-neutral-600">
              <span>&copy; {currentYear} Saroop Singh Archive.</span>
              <span className="hidden sm:inline">Made with</span>
              <Heart className="w-4 h-4 text-accent-500 fill-current animate-pulse" />
              <span>for Malaysian sports history.</span>
            </div>
            
            <div className="flex items-center gap-6 text-[14px]">
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-neutral-600 hover:text-primary-600 transition-colors duration-200">
                Terms of Use
              </a>
            </div>
          </div>
        </VStack>
      </ResponsiveContainer>
    </footer>
  );
}

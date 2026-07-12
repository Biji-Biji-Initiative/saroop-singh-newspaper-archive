import Link from 'next/link';
import { ResponsiveContainer } from '@/components/layout/responsivecontainer';

const explore = [
  ['/story', 'Guided family story'],
  ['/articles', 'Newspaper collection'],
  ['/timeline', 'Chronology'],
  ['/people', 'People in the records'],
  ['/gallery', 'Photographs'],
  ['/contribute', 'Contribute photographs'],
  ['/remember', 'Family Memory Room'],
  ['/family-day', 'Family archive day'],
] as const;

const archive = [
  ['/methodology', 'Archive method'],
  ['/api/archive/manifest', 'Preservation manifest'],
  ['/about', 'About Saroop Singh'],
  ['/studio', 'Owner preservation studio'],
  ['/privacy', 'Privacy and contributions'],
] as const;

export function Footer() {
  return (
    <footer className="border-t border-stone-700 bg-[#1f2a24] text-stone-300">
      <ResponsiveContainer className="py-14 sm:py-18">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.7fr_0.7fr_1fr]">
          <div>
            <p className="font-serif text-2xl text-white">Saroop Singh Archive</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-stone-300">A family-led archive of Saroop Singh, a Sikh middle-distance runner documented in pre-war Malaya.</p>
          </div>
          <nav aria-label="Explore archive">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Explore</p>
            <ul className="mt-4 space-y-3 text-sm">
              {explore.map(([href, label]) => <li key={href}><Link className="hover:text-white" href={href}>{label}</Link></li>)}
            </ul>
          </nav>
          <nav aria-label="Archive information">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Archive</p>
            <ul className="mt-4 space-y-3 text-sm">
              {archive.map(([href, label]) => <li key={href}><Link className="hover:text-white" href={href}>{label}</Link></li>)}
            </ul>
          </nav>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Contribute</p>
            <p className="mt-4 text-sm leading-6 text-stone-300">Have a clipping, photograph, correction, or family account?</p>
            <a href="mailto:gurpreet@mereka.io?subject=Saroop%20Singh%20Archive%20contribution" className="mt-4 inline-block text-sm font-semibold text-white underline decoration-amber-400 underline-offset-4">Contact the archive</a>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-stone-700 pt-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Saroop Singh Archive</span>
          <span>Historical uncertainty is documented, not concealed.</span>
        </div>
      </ResponsiveContainer>
    </footer>
  );
}

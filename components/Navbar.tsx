import Link from 'next/link'
import MobileMenu from './MobileMenu'

const navLinks = [
  { href: '/coupons', label: 'كوبونات يوديمي' },
  { href: '/scholarships', label: 'المنح الدراسية' },
  { href: '/career', label: 'أدوات التوظيف الذكية' },
  { href: '/roadmaps', label: 'خارطة الطريق المهنية' },
]

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight">
            UdemyRadar
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
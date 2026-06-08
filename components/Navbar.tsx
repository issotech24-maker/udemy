import Link from 'next/link'
import MobileMenu from './MobileMenu'

const navLinks = [
  { href: '/coupons',      label: 'كوبونات يوديمي' },
  { href: '/scholarships', label: 'المنح الدراسية'  },
  { href: '/career',       label: 'أدوات التوظيف'   },
  { href: '/roadmaps',     label: 'خارطة الطريق'    },
]

export default function Navbar() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">

          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="UdemyRadar"
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" aria-hidden="true" />
            <span className="text-base font-bold text-slate-900 tracking-tight">UdemyRadar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="التنقل الرئيسي">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-slate-600 rounded-md hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block shrink-0">
            <Link
              href="/coupons"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md transition-colors"
            >
              ابدأ مجاناً
            </Link>
          </div>

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
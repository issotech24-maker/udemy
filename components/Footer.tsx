import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900 mb-1">UdemyRadar</p>
            <p className="text-sm text-slate-500">
              منصة ذكية للطلاب العرب وأصحاب المهن التقنية
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
            <Link href="/coupons" className="hover:text-slate-900 transition-colors">
              كوبونات يوديمي
            </Link>
            <Link href="/scholarships" className="hover:text-slate-900 transition-colors">
              المنح الدراسية
            </Link>
            <Link href="/career" className="hover:text-slate-900 transition-colors">
              أدوات التوظيف
            </Link>
            <Link href="/roadmaps" className="hover:text-slate-900 transition-colors">
              خارطة الطريق
            </Link>
          </nav>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} UdemyRadar. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}

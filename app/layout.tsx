import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { MobileNav } from "./components/MobileNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", /* Prevent FOIT (Flash of Invisible Text) */
});

/* ─── SEO & Meta ─── */
export const metadata: Metadata = {
  title: "FiveO Motorsport | Fuel Injector Oracle",
  description: "High-precision fuel injector sizing, expert technical matching, and real-time flow rate calculations for automotive and motorcycle applications.",
  keywords: ["fuel injectors", "flow rate calculator", "injector sizing", "E85 injectors", "FiveO Motorsport"],
  openGraph: {
    title: "FiveO Motorsport | Fuel Injector Oracle",
    description: "The most advanced fuel injector sizing tool in the industry.",
    type: "website",
  },
};

/* ─── Viewport Configuration ─── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,           /* Allow pinch-to-zoom for accessibility */
  userScalable: true,         /* Never disable zoom — WCAG requirement */
  viewportFit: "cover",       /* Extend into notch/safe areas */
  themeColor: "#000000",      /* Browser chrome color on mobile */
};

const NAV_ITEMS = [
  "Injectors",
  "Fuel Pumps",
  "Connectors",
  "Sensors",
  "Accessories",
  "Services",
  "FAQ & Tech",
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        {/* ═══ 1. Promotional Banner ═══ */}
        <div
          className="fiveo-banner-blue"
          role="banner"
          aria-label="Promotional banner"
        >
          <span className="hidden sm:inline">
            Subscribe to our newsletter for exclusive access to discounts and promotions
          </span>
          <span className="sm:hidden">
            Exclusive discounts & promotions
          </span>
          <span className="ml-2 bg-white text-[#00AEEF] px-3 py-1 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors inline-block text-[10px] sm:text-xs font-black">
            Subscribe Now
          </span>
        </div>

        {/* ═══ 2. Main Header ═══ */}
        <header
          className="bg-black/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="fiveo-container flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo — Responsive sizing with padding */}
            <a href="/" className="flex-shrink-0 flex items-center py-2 sm:py-4" aria-label="FiveO Motorsport Home">
              <Image
                src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                alt="FiveO Motorsport Logo"
                width={200}
                height={60}
                className="w-auto h-8 sm:h-12 lg:h-14"
                priority
              />
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7" aria-label="Desktop navigation">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[11px] xl:text-xs font-bold uppercase tracking-wider hover:text-[#00AEEF] transition-colors whitespace-nowrap py-2"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search Button — Squared off like screenshot */}
              <button
                className="bg-[#E10600] text-white text-[12px] font-black uppercase px-6 py-2 rounded-none hidden sm:flex items-center justify-center hover:bg-white hover:text-[#E10600] transition-colors tracking-tighter"
                aria-label="Search products"
              >
                SEARCH
              </button>

              {/* Driver/Account Icon (Helmet SVG) */}
              <button className="p-1 hover:text-[#00AEEF] transition-colors flex items-center" aria-label="User account">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M16,2C8.28,2,2,8.28,2,16s6.28,14,14,14s14-6.28,14-14S23.72,2,16,2z M16,28c-6.62,0-12-5.38-12-12S9.38,4,16,4s12,5.38,12,12 S22.62,28,16,28z M16,7c-3.31,0-6,2.69-6,6c0,2.16,1.15,4.05,2.87,5.12L11,24h10l-1.87-5.88C20.85,17.05,22,15.16,22,13 C22,9.69,19.31,7,16,7z M14.12,22l0.63-2H17.25l0.63,2H14.12z M16,16c-1.65,0-3-1.35-3-3s1.35-3,3-3s3,1.35,3,3S17.65,16,16,16z"/>
                </svg>
              </button>

              {/* Cart Icon with Label */}
              <button className="flex items-center gap-2 hover:text-[#00AEEF] transition-colors group" aria-label="Shopping cart, 0 items">
                <div className="relative p-1">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#E10600] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-black">
                    0
                  </span>
                </div>
                <span className="text-[11px] font-black uppercase tracking-tighter hidden md:inline group-hover:text-white">0 ITEMS</span>
              </button>

              {/* Mobile Hamburger (< lg) */}
              <MobileNav items={[...NAV_ITEMS]} />
            </div>
          </div>

          {/* ═══ Grey Ribbon (Breadcrumb Bar) ═══ */}
          <div className="bg-[#B3B3B3] border-t border-black/10">
            <div className="fiveo-container h-8 flex items-center">
               <nav className="flex items-center gap-2 text-[10px] font-bold uppercase text-black/70">
                 <a href="/" className="hover:text-black transition-colors">Home</a>
                 <span className="text-black/30 transform scale-75">›</span>
                 <span className="text-black/90">Fuel Injector Oracle</span>
               </nav>
            </div>
          </div>
        </header>

        {/* ═══ 3. Main Content Wrapper ═══ */}
        <main className="flex-grow flex flex-col items-center w-full" id="main-content" role="main">
          <div className="w-full flex flex-col items-center">
            {children}
          </div>
        </main>

        {/* ═══ 4. Footer ═══ */}
        <footer
          className="bg-black border-t border-white/10 py-8 sm:py-12"
          role="contentinfo"
          style={{ paddingBottom: `max(2rem, var(--safe-bottom))` }}
        >
          <div className="fiveo-container flex flex-col sm:flex-row justify-between items-center gap-4 opacity-60 text-[10px] uppercase tracking-widest">
            <p>© {new Date().getFullYear()} FiveO Motorsport, Inc. All Rights Reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a href="#" className="hover:text-white transition-colors py-1">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors py-1">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors py-1">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

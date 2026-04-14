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
            {/* Logo — Responsive sizing */}
            <a href="/" className="flex-shrink-0 min-h-0" aria-label="FiveO Motorsport Home">
              <Image
                src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                alt="FiveO Motorsport Logo"
                width={200}
                height={60}
                className="w-auto h-10 sm:h-12 lg:h-16"
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
              {/* Search Button (tablet+) */}
              <button
                className="bg-[#E10600] text-white text-[10px] sm:text-xs font-black uppercase px-4 sm:px-6 py-2 rounded-sm hidden sm:flex items-center justify-center hover:bg-white hover:text-[#E10600] transition-colors"
                aria-label="Search products"
              >
                Search
              </button>

              {/* User Icon */}
              <button className="p-2 hover:text-[#00AEEF] transition-colors" aria-label="User account">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Cart Icon */}
              <button className="p-2 relative hover:text-[#00AEEF] transition-colors" aria-label="Shopping cart, 0 items">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute top-0.5 right-0.5 bg-[#E10600] text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Mobile Hamburger (< lg) */}
              <MobileNav items={[...NAV_ITEMS]} />
            </div>
          </div>
        </header>

        {/* ═══ 3. Main Content ═══ */}
        <main className="flex-grow" id="main-content" role="main">
          {children}
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

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { MobileNav } from "./components/MobileNav";

import { Open_Sans, Roboto_Condensed } from "next/font/google";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

const openSansCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-open-sans-condensed",
  display: "swap",
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
    <html lang="en" className={`${openSans.variable} ${openSansCondensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8f9fa] text-[#333333] font-sans">
        {/* ═══ 1. Modern Glassmorphic Header ═══ */}
        <header
          className="bg-[#09090b]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-black/10"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="fiveo-container flex items-center justify-between py-4 sm:py-5">
            
            {/* Left Block: Logo + Navigation */}
            <div className="flex items-center gap-10 xl:gap-14">
              {/* Logo */}
              <a href="/" className="flex-shrink-0 flex items-center" aria-label="FiveO Motorsport Home">
                <Image
                  src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                  alt="FiveO Motorsport Logo"
                  width={220}
                  height={66}
                  className="w-auto h-12 sm:h-14 lg:h-16 transition-transform hover:scale-105 duration-300"
                  priority
                />
              </a>

              {/* Desktop Nav - Left Aligned next to Logo */}
              <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Desktop navigation">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="relative text-[13px] font-bold uppercase tracking-[0.1em] text-white/80 hover:text-white transition-colors group py-2"
                    style={{ fontFamily: 'var(--font-open-sans-condensed), sans-serif' }}
                  >
                    {item}
                    {/* Electric Blue Animated Underline */}
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00AEEF] transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Right Block: Utilities */}
            <div className="flex items-center gap-6 xl:gap-8">
              {/* Minimal Search Icon */}
              <button className="text-white/80 hover:text-[#00AEEF] transition-colors" aria-label="Search">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account Icon */}
              <button className="text-white/80 hover:text-[#00AEEF] transition-colors" aria-label="User account">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Cart Icon with notification pip */}
              <button className="flex items-center gap-2 text-white/80 hover:text-[#00AEEF] transition-colors group relative" aria-label="Shopping cart, 0 items">
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {/* Red pip indicator */}
                <span className="absolute -top-1 -right-2 bg-[#E10600] text-white text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                  0
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* ═══ 2. Main Content & Context Rail (Boxed White Area) ═══ */}
        <div className="flex-grow w-full bg-[#f8f9fa] py-8 sm:py-12 flex flex-col items-center">
          <div className="fiveo-container !px-0 sm:!px-4 lg:!px-8 w-full flex-grow">
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-black/5 w-full h-full flex flex-col overflow-hidden">
              
              {/* Standard Breadcrumb Spacing */}
              <div className="pt-6 pb-4 px-6 sm:px-10 border-b border-gray-100">
                <nav className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#a8a8a8]">
                  <a href="/" className="inline-flex items-center leading-none hover:text-black transition-colors">Home</a>
                  <svg className="w-3 h-3 text-gray-300 block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <a href="#" className="inline-flex items-center leading-none hover:text-black transition-colors">Fuel Injectors</a>
                  <svg className="w-3 h-3 text-gray-300 block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="inline-flex items-center leading-none text-[#E10600]">Oracle</span>
                </nav>
              </div>

              {/* Main Content Wrapper */}
              <main className="flex-grow w-full px-6 sm:px-10" id="main-content" role="main">
                {children}
              </main>
              
            </div>
          </div>
        </div>

        {/* ═══ 4. Premium Modern Footer ═══ */}
        <footer
          className="bg-[#09090b] text-white pt-16 pb-8 mt-12 sm:mt-16 border-t border-white/5"
          role="contentinfo"
        >
          <div className="fiveo-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              {/* Col 1: Customer Service */}
              <div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-6 text-white/90">Customer Service</h4>
                <ul className="space-y-4 text-[13px] tracking-wider text-gray-400 font-medium">
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>About Us</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Contact Us</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Shipping & Returns</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Privacy Policy</a></li>
                </ul>
              </div>

              {/* Col 2: Technical Info */}
              <div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-6 text-white/90">Technical Info</h4>
                <ul className="space-y-4 text-[13px] tracking-wider text-gray-400 font-medium">
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Flow Rate Tables</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>FAQ & Tech Support</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Tuning Data</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Warranty</a></li>
                </ul>
              </div>

              {/* Col 3: My Account */}
              <div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-6 text-white/90">My Account</h4>
                <ul className="space-y-4 text-[13px] tracking-wider text-gray-400 font-medium">
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Login / Register</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Order History</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Wish List</a></li>
                  <li><a href="#" className="hover:text-[#00AEEF] transition-colors flex items-center gap-2 group"><span className="w-0 h-[1px] bg-[#00AEEF] transition-all group-hover:w-3"></span>Track My Order</a></li>
                </ul>
              </div>

              {/* Col 4: Newsletter/Branding */}
              <div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] mb-6 text-white/90">FiveO Racing</h4>
                <p className="text-[14px] text-gray-500 mb-8 font-normal leading-relaxed">
                  The ultimate in high-performance fuel injection. Real-time physics, expert calibration.
                </p>
                <div className="flex gap-4">
                  {/* Clean SVG Social Icons */}
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#00AEEF] hover:border-[#00AEEF] hover:text-white transition-all duration-300 cursor-pointer text-gray-400">
                    <span className="text-sm font-bold">f</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#E10600] hover:border-[#E10600] hover:text-white transition-all duration-300 cursor-pointer text-gray-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] uppercase font-bold tracking-[0.1em] text-gray-600">
              <div className="flex flex-col gap-1 items-start sm:items-center sm:flex-row sm:gap-4">
                <p>© {new Date().getFullYear()} FiveO Motorsport, Inc. All Rights Reserved.</p>
                <span className="text-[9px] text-[#00AEEF]">Build: 17:35 (Standard Shell Spacing)</span>
              </div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Payments We Accept</a>
                <a href="#" className="hover:text-white transition-colors">Secure Shopping</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

/* Vercel Force-Sync Build Trigger: April 16, 2026 - 17:35 (Cache Buster) */

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
          <div className="fiveo-container flex items-center justify-between pt-5 sm:pt-6 oracle-logo-offset">
            
            {/* Left Block: Logo + Navigation */}
            <div className="flex items-center gap-10 xl:gap-14">
              <a href="/" className="flex-shrink-0 flex items-center oracle-logo-top-margin" aria-label="FiveO Motorsport Home">
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
        <div className="flex-grow w-full bg-[#f8f9fa] pt-8 pb-16 sm:pb-24 lg:pb-32 flex flex-col items-center">
          <div className="fiveo-container !px-0 sm:!px-4 lg:!px-8 w-full flex-grow">
            <div className="bg-white rounded-lg shadow-sm ring-1 ring-black/5 w-full h-full flex flex-col overflow-hidden">
              
              {/* Standard Premium Breadcrumb Spacing */}
              <div className="pt-6 pb-4 pr-6 sm:pr-10 border-b border-gray-100 oracle-breadcrumb-indent">
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

        {/* ═══ 4. Canonical FiveO Website Footer ═══ */}
        <footer
          className="bg-black text-white border-t-[3px] border-[#00AEEF] pt-16 pb-8"
          role="contentinfo"
        >
          <div className="fiveo-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6 mb-16">
              
              {/* Col 1: Logos */}
              <div className="flex flex-col gap-6 items-start lg:col-span-1">
                <Image
                  src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                  alt="FiveO Motorsport"
                  width={160}
                  height={48}
                  className="w-auto h-12"
                />
              </div>

              {/* Col 2: Shop */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 oracle-footer-heading-offset">Shop</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">Fuel Injectors</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Fuel Pumps</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">More Products</a></li>
                </ul>
              </div>

              {/* Col 3: Menu */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 oracle-footer-heading-offset">Menu</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Links</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Our Warranty</a></li>
                </ul>
              </div>

              {/* Col 4: Contact Us */}
              <div className="lg:col-span-1">
                <h4 className="text-[16px] font-bold text-white mb-6 oracle-footer-heading-offset">Contact us</h4>
                <div className="space-y-4 text-[11px] text-[#cccccc]">
                  <div>
                    <strong className="text-white uppercase font-bold text-[12px] block mb-1">Phone:</strong>
                    <p className="mb-1 leading-relaxed">CALIFORNIA OFFICE: (562) 867-4999</p>
                    <p>OREGON OFFICE: (503) 508-5392</p>
                  </div>
                  <div className="pt-2">
                    <strong className="text-white uppercase font-bold text-[12px] block mb-1">Email:</strong>
                    <p className="uppercase">CONTACT@FIVEOMOTORSPORT.COM</p>
                  </div>
                </div>
              </div>

              {/* Col 5: Follow Us */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 oracle-footer-heading-offset">Follow us</h4>
                <ul className="space-y-6 text-[12px] text-[#cccccc] uppercase font-bold">
                  <li>
                    <a href="#" className="hover:text-white transition-colors flex items-center gap-4">
                      {/* F icon standard */}
                      <span className="text-white text-lg font-serif italic w-4 text-center">f</span>
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors flex items-center gap-4">
                      {/* Twitter bird icon placeholder */}
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                      Twitter
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 6: Join Us */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 oracle-footer-heading-offset">Join us</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">Join Our Newsletter</a></li>
                </ul>
              </div>

            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] uppercase font-bold tracking-[0.1em] text-[#666666]">
              <div className="flex flex-col gap-1 items-start sm:items-center sm:flex-row sm:gap-4">
                <p>© {new Date().getFullYear()} FiveO Motorsport, Inc. All Rights Reserved.</p>
                <span className="text-[9px] text-[#00AEEF]">Build: 18:40 (Footer Corrections)</span>
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

/* Vercel Force-Sync Build Trigger: April 16, 2026 - 18:40 (Precision Architecture) */

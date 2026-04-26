import type { Metadata, Viewport } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "./components/MobileNav";
import { Open_Sans, Roboto_Condensed } from "next/font/google";

/**
 * FiveO Motorsport | Root Layout
 * 
 * This is the primary shell for the Fuel Injector Oracle application.
 * It manages:
 * - SEO Metadata and Viewport settings
 * - Global design system (Next.js Fonts + Tailwind 4)
 * - Navigation (Desktop and Mobile)
 * - The canonical FiveO Footer
 */

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
      <body className="min-h-dvh flex flex-col bg-[#f8f9fa] text-[#333333] font-sans">
        
        {/* ═══ 0. Promotional Top Bar ═══ */}
        <div className="bg-[#00AEEF] w-full h-auto sm:h-auto lg:h-[48px] min-h-0 hidden sm:flex items-center justify-center py-3 lg:py-0 px-4 relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
            <span 
              className="text-white text-[15px] sm:text-[16px] antialiased text-shadow-sm font-medium"
              style={{ fontFamily: 'var(--font-open-sans), sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              Subscribe to our newsletter for exclusive access to discounts and promotions
            </span>
            <a 
              href="#" 
              className="inline-flex items-center justify-center bg-[#1390CE] text-white text-[14px] sm:text-[15px] font-bold uppercase tracking-wide py-0 h-auto sm:h-[18px] lg:h-[22px] leading-none min-h-0 rounded-[3px] transition-colors hover:bg-[#0E7AAB] shadow-sm ml-2 lg:ml-6"
              style={{ paddingLeft: '10px', paddingRight: '10px', fontFamily: 'var(--font-open-sans-condensed), sans-serif' }}
            >
              Subscribe Now
            </a>
          </div>
        </div>

        {/* ═══ 1. Modern Glassmorphic Header ═══ */}
        <header
          className="bg-[#09090b]/90 backdrop-blur-xl border-b border-white/5 relative z-50 shadow-2xl shadow-black/10 w-full"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="w-full flex justify-center">
            <div className="max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between pt-5 sm:pt-6 pb-2">
            
            {/* Left Block: Logo + Navigation */}
            <div className="flex items-center gap-10 xl:gap-14">
              <Link href="/" className="flex-shrink-0 flex items-center mt-2" aria-label="FiveO Motorsport Home">
                <Image
                  src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                  alt="FiveO Motorsport Logo"
                  width={220}
                  height={66}
                  className="w-auto h-12 sm:h-14 lg:h-16 transition-transform hover:scale-105 duration-300"
                  priority
                />
              </Link>

              {/* Desktop Nav - Left Aligned next to Logo */}
              <nav className="hidden lg:flex items-center gap-4 xl:gap-6 h-10" aria-label="Desktop navigation">
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-[16px] font-bold not-italic uppercase text-white hover:text-[#00AEEF] transition-colors flex items-center h-full translate-y-[1px]"
                    style={{ fontFamily: 'var(--font-open-sans-condensed), sans-serif' }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right Block: Utilities */}
            <div className="flex items-center gap-6 xl:gap-8 h-10">
              {/* Minimal Search Icon */}
              <button className="text-white hover:text-[#00AEEF] transition-colors flex items-center h-full" aria-label="Search">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account Icon (FiveO Native Geometry) */}
              <button className="text-white hover:text-[#00AEEF] transition-colors flex items-center justify-center p-1 h-full" aria-label="User account">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" stroke="none" viewBox="0 0 76.3 79.4">
                  <path d="M76.1,70.3l-3.6-10.8c-0.2-0.5-0.5-1-0.7-1.5c-2.9,2.1-5.2,7.1-6.9,12.5h-1.8c0.3-8.4,2.5-12.1,4.9-16.2
                      c-0.2-0.1-0.3-0.2-0.5-0.3l-9.8-3.9h-0.3c-0.4,0.5-0.9,1-1.3,1.4c-4.8,4.7-11.2,7.3-18,7.3c-6.8,0-13.2-2.7-18-7.3
                      c-0.5-0.4-0.9-0.9-1.3-1.4h-0.2l-9.8,3.9c-0.2,0.1-0.3,0.2-0.5,0.3c2.4,4,4.6,7.8,4.9,16.2h-1.8c-1.7-5.4-4-10.4-6.9-12.5
                      C4.3,58.5,4,59,3.8,59.5L0.2,70.3c-0.8,3.2,0.8,4.5,2.3,4.9c6.2,1.4,23.7,4.2,35.7,4.2v0l0,0c12,0,29.5-2.8,35.7-4.2
                      C75.3,74.8,76.9,73.5,76.1,70.3z M38.2,53.1c10.9,0,18.7-7.9,22.6-21.8C66.2,11.7,54.2,0,38.2,0C22.1,0,10.1,11.7,15.6,31.3
                      C19.5,45.2,27.3,53.1,38.2,53.1z M22.3,21.7c0.6-0.1,1.4,0.1,2.2,0.5c3.7,1.5,8.3,2.4,13.7,2.5c5.4,0,10-0.9,13.7-2.5
                      c2.2-0.9,3.9-0.8,3.7,2.4c-0.7,11.2-7.6,14.5-17.4,14.6c-9.7-0.1-16.6-3.4-17.4-14.6C20.7,22.6,21.3,21.8,22.3,21.7z" />
                </svg>
              </button>

              {/* Cart Icon (FiveO Native Geometry) with notification pip */}
              <button className="flex items-center gap-2 text-white hover:text-[#00AEEF] transition-colors group relative p-1 h-full" aria-label="Shopping cart, 0 items">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" stroke="none" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 512 512">
                  <path d="M245.626,416.026h-0.007c-2.962-1.693-6.107-3.034-9.389-4.103
                      c-1.367-0.455-2.741-0.872-4.154-1.211c-1.067-0.247-2.129-0.494-3.223-0.664c-2.702-0.469-5.443-0.794-8.263-0.794
                      c-1.491,0-2.995,0.078-4.512,0.208c-2.943,0.247-5.75,0.859-8.497,1.589c-1.134,0.3-2.247,0.625-3.354,0.989
                      c-1.159,0.404-2.266,0.886-3.386,1.381c-2.924,1.198-5.678,2.644-8.282,4.35c-0.013,0-0.02,0-0.026,0
                      c-15.313,9.987-24.879,27.633-23.205,47.166c0.592,6.915,2.565,13.361,5.561,19.169c2.435-0.261,4.851-0.599,7.357-0.599
                      c24.716,0,44.073,12.24,44.522,27.933c27.139-3.372,47.037-27.556,44.693-55.176C269.958,438.659,259.808,424.074,245.626,416.026z
                      M409.381,415.427c-18.608,1.589-32.412,18.023-30.797,36.671c1.614,18.596,18.127,32.517,36.657,30.876
                      c18.647-1.654,32.36-18.036,30.745-36.71C444.372,427.538,428.068,413.812,409.381,415.427z M220.363,507.391
                      c-0.117-0.326-0.358-0.625-0.495-0.938c-2.995-6.98-11.355-12.697-22.483-15.445c-0.006-0.013-0.006,0-0.006-0.013
                      c-4.649-1.146-9.767-1.784-15.132-1.784c-9.298,0-17.724,1.979-24.417,5.157c-5.47-14.754-21.903-25.562-41.554-25.562
                      c-9.819,0-18.766,2.773-26.058,7.279c-4.128-20.914-22.542-36.697-44.666-36.697c-25.146,0-45.552,20.394-45.552,45.552
                      c0,10.184,3.45,19.482,9.083,27.061h212.073v-0.013c0-0.013,0-0.013,0-0.013c0-0.729-0.254-1.406-0.364-2.109
                      C220.662,509.031,220.643,508.186,220.363,507.391z M511.684,204.896c-0.833-9.128-6.967-14.904-16.043-16.187
                      c-4.337-0.618-8.868-0.423-13.27-0.045c-98.058,8.575-196.129,17.222-294.187,25.856c-2.096,0.182-4.219,0.371-6.68,0.592
                      c-2.735-12.436-6.485-24.358-7.723-36.528c-1.81-17.788-11.668-28.245-27.061-34.971c-0.885-0.391-1.731-0.951-2.643-1.315
                      c-34.354-13.719-68.68-27.536-103.124-41.053c-7.826-3.073-15.431,1.211-18.309,9.565c-2.956,8.542-0.808,16.246,4.545,23.154
                      c5.104,6.589,12.059,10.574,19.768,13.387c21.018,7.664,42.113,15.112,63.027,23.075c9.623,3.659,18.101,9.428,20.692,20.236
                      c4.701,19.684,8.829,39.497,13.244,59.245c11.003,49.14,21.994,98.272,33.076,147.392c1.53,6.746,4.141,11.851,7.761,15.497
                      c8.647-6.485,19.039-10.848,30.576-11.851c1.765-0.156,3.517-0.234,5.255-0.234h0.007c14.669,0,27.978,5.365,38.351,14.143
                      c63.613-5.574,127.214-11.16,190.841-16.747c13.816-1.211,21.474-7.97,24.508-21.552c0.443-1.914,0.808-3.867,1.276-5.782
                      c11.694-48.455,23.544-96.873,34.952-145.387C512.074,218.804,512.296,211.655,511.684,204.896z M446.885,314.668
                      c-2.227,11.296-4.545,22.573-6.732,33.877c-0.469,2.383-1.302,3.672-4.037,3.906c-72.989,6.342-145.966,12.775-218.93,19.169
                      c-0.481,0.053-0.977-0.078-2.201-0.208c-2.761-12.801-5.482-25.433-8.282-38.494c80.296-7.071,160.07-14.09,240.196-21.148
                      C446.898,312.844,447.055,313.795,446.885,314.668z M455.597,271.453c-0.183,0.912-1.562,1.804-2.578,2.24
                      c-1.003,0.442-2.266,0.286-3.412,0.384c-81.623,7.188-163.247,14.377-244.87,21.565c-1.784,0.156-3.568,0.312-5.886,0.521
                      c-3.021-13.869-5.951-27.438-8.985-41.456c91.299-8.042,182.155-16.044,273.832-24.117
                      C461.001,244.452,458.371,257.968,455.597,271.453z" />
                </svg>
                {/* Red pip indicator */}
                <span className="absolute top-[2px] -right-2 bg-[#E10600] text-white text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                  0
                </span>
              </button>
              
              {/* Mobile Hamburger Menu (hidden on lg and up) */}
              <MobileNav items={[...NAV_ITEMS]} />
            </div>
          </div>
        </div>
      </header>

        {/* ═══ 2. Main Content & Context Rail (Boxed White Area) ═══ */}
        <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-7xl px-0 md:px-6 lg:px-8 md:my-12 flex-1 min-h-0 flex flex-col">
            <div className="md:bg-white md:rounded-lg md:shadow-sm md:ring-1 md:ring-black/5 w-full flex-1 min-h-0 flex flex-col overflow-hidden">
              
              {/* Standard Premium Breadcrumb Spacing */}
              <div className="hidden md:block pt-6 pb-4 px-6 sm:px-10 border-b border-gray-100 pl-8">
                <nav className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-[#a8a8a8] pl-[10px]">
                  <Link href="/" className="inline-flex items-center leading-none hover:text-black transition-colors">Home</Link>
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
              <main className="flex-1 min-h-0 w-full pb-0 md:pb-10 flex flex-col" id="main-content" role="main">
                {children}
              </main>
              
            </div>
          </div>
        </div>

        {/* ═══ 4. Canonical FiveO Website Footer ═══ */}
        <footer
          className="bg-black text-white border-t-[3px] border-[#00AEEF] pt-16 pb-8 w-full"
          role="contentinfo"
        >
          <div className="w-full flex justify-center">
            <div className="max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6 mb-16">
              
              {/* Col 1: Logos */}
              <div className="flex flex-col gap-6 items-start lg:col-span-1 pt-5">
                <Link href="/">
                  <Image
                    src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png"
                    alt="FiveO Motorsport"
                    width={160}
                    height={48}
                    className="w-auto h-12"
                  />
                </Link>
              </div>

              {/* Col 2: Shop */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 pt-5">Shop</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">Fuel Injectors</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Fuel Pumps</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">More Products</a></li>
                </ul>
              </div>

              {/* Col 3: Menu */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 pt-5">Menu</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Links</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Our Warranty</a></li>
                </ul>
              </div>

              {/* Col 4: Contact Us */}
              <div className="lg:col-span-1">
                <h4 className="text-[16px] font-bold text-white mb-6 pt-5">Contact us</h4>
                <div className="space-y-4 text-[11px] text-[#cccccc]">
                  <div>
                    <strong className="text-white uppercase font-bold text-[12px] block mb-1">Phone:</strong>
                    <p className="mb-1 leading-relaxed">CALIFORNIA OFFICE: (562) 867-4999</p>
                    <p>OREGON OFFICE: (503) 508-5392</p>
                  </div>
                  <div className="pt-2 !pb-5">
                    <strong className="text-white uppercase font-bold text-[12px] block mb-1">Email:</strong>
                    <p className="uppercase">CONTACT@FIVEOMOTORSPORT.COM</p>
                  </div>
                </div>
              </div>

              {/* Col 5: Follow Us */}
              <div>
                <h4 className="text-[16px] font-bold text-white mb-6 pt-5">Follow us</h4>
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
                <h4 className="text-[16px] font-bold text-white mb-6 pt-5">Join us</h4>
                <ul className="space-y-4 text-[12px] text-[#cccccc] uppercase">
                  <li><a href="#" className="hover:text-white transition-colors">Join Our Newsletter</a></li>
                </ul>
              </div>

            </div>

            <div className="!pt-10 pb-4 border-t border-white/20 flex flex-col items-center justify-center gap-2 text-[11px] text-[#cccccc] text-center w-full">
              <p>© {new Date().getFullYear()} FIVEOMOTORSPORT, INC. ALL RIGHTS RESERVED. LOS ANGELES, CALIFORNIA | SALEM, OREGON</p>
            </div>
          </div>
        </div>
      </footer>
      </body>
    </html>
  );
}

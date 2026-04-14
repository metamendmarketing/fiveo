import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FiveO Motorsport | Fuel Injector Oracle",
  description: "High-precision fuel injector sizing and expert technical matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        {/* 1. Promotional Banner (FiveO Blue) */}
        <div className="bg-[#00AEEF] text-white text-[10px] md:text-sm font-bold uppercase tracking-widest text-center py-2 px-4">
          Subscribe to our newsletter for exclusive access to discounts and promotions 
          <span className="ml-2 bg-white text-[#00AEEF] px-2 py-0.5 rounded-sm cursor-pointer hover:bg-gray-100 transition-colors">
            Subscribe Now
          </span>
        </div>

        {/* 2. Main Header */}
        <header className="bg-black border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer">
              <Image 
                src="https://www.fiveomotorsport.com/media/logo/stores/1/fiveo-logo-dec-2022-01_2.png" 
                alt="FiveO Motorsport Logo" 
                width={200} 
                height={60}
                className="w-auto h-12 md:h-16"
                priority
              />
            </div>

            {/* Nav (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-6 text-[11px] font-bold uppercase tracking-wider">
              {['Injectors', 'Fuel Pumps', 'Connectors', 'Sensors', 'Accessories', 'Services', 'FAQ & Tech'].map((item) => (
                <a key={item} href="#" className="hover:text-[#00AEEF] transition-colors">
                  {item}
                </a>
              ))}
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center space-x-4">
              <button className="bg-[#E10600] text-black text-xs font-black uppercase px-6 py-2 rounded-sm hidden sm:block hover:bg-white hover:text-[#E10600] transition-colors">
                Search
              </button>
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-white cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="relative cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#E10600] text-white text-[8px] font-bold px-1 rounded-full">0</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Main Content Rendering */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 4. Footer */}
        <footer className="bg-black border-t border-white/10 py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center opacity-60 text-[10px] uppercase tracking-widest">
            <p>© {new Date().getFullYear()} FiveO Motorsport, Inc. All Rights Reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

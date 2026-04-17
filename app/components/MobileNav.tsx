"use client";

import { useState, useEffect } from "react";

interface MobileNavProps {
  items: string[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Close on route change or resize past breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="lg:hidden p-2 relative z-[60]"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span
            className={`block h-0.5 bg-white transition-all duration-300 origin-center ${
              isOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block h-0.5 bg-white transition-all duration-300 ${
              isOpen ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 bg-white transition-all duration-300 origin-center ${
              isOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </div>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] sm:w-[320px] bg-black border-l border-white/10 z-[58] transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        style={{ 
          paddingTop: "var(--safe-top)", 
          paddingBottom: "var(--safe-bottom)",
          backgroundColor: "#0F0F0F" 
        }}
      >
        <div className="flex flex-col h-full pt-20 px-6">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation links">
            {items.map((item) => (
              <a
                key={item}
                href="#"
                onClick={() => setIsOpen(false)}
                className="text-white text-sm font-bold uppercase tracking-wider py-4 px-2 border-b border-white/5 hover:text-[#00AEEF] hover:border-[#00AEEF]/20 transition-all"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Mobile Search */}
          <button className="fiveo-button-red w-full mt-8 text-sm tracking-[0.3em] text-white">
            Search
          </button>

          <div className="mt-auto pb-8 opacity-40 text-[9px] uppercase tracking-widest text-center text-white">
            © {new Date().getFullYear()} FiveO Motorsport
          </div>
        </div>
      </div>
    </>
  );
}

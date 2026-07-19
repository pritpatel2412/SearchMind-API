import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Menu } from 'lucide-react';

const Logo = () => {
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0" fill="#ef4d23">
      {angles.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 16 + 10 * Math.cos(rad);
        const cy = 16 + 10 * Math.sin(rad);
        return <circle key={angle} cx={cx} cy={cy} r="3.5" />;
      })}
      <circle cx="16" cy="16" r="3.5" />
    </svg>
  );
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const NavItems = () => (
    <>
      <a href="#" className="flex items-center gap-1.5 text-neutral-900 font-medium">
        <span className="w-1 h-1 bg-black rounded-full block"></span>
        Home
      </a>
      <a href="#" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
        Features
      </a>
      <a href="#" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">
        About
      </a>
      <a href="#" className="flex items-center gap-1 text-[#ef4d23] font-medium">
        Pages
        <ChevronDown className="w-3.5 h-3.5" />
      </a>
    </>
  );

  return (
    <div className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4">
      <nav className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
        
        {/* Left: Logo */}
        <a href="#" className="pl-1 sm:pl-2">
          <Logo />
        </a>

        {/* Middle: Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-[14px] ml-8">
          <NavItems />
        </div>

        {/* Right: CTA & Menu */}
        <div className="ml-auto flex items-center gap-2 sm:gap-4 pr-1">
          <button className="hidden sm:flex text-neutral-700 hover:text-neutral-900">
            <ShoppingCart className="w-5 h-5" />
          </button>
          
          <button className="bg-[#ef4d23] text-white rounded-full flex items-center gap-2 pl-3 sm:pl-4 pr-1 py-1 sm:py-1.5 transition-opacity hover:opacity-90">
            <span className="text-[13px] sm:text-[14px] font-medium">
              <span className="hidden sm:inline">Get early access</span>
              <span className="sm:hidden">Early access</span>
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          <button 
            className="md:hidden flex items-center justify-center p-1.5 text-neutral-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-4 z-20 flex flex-col gap-4 text-[15px] md:hidden">
            <NavItems />
            <button className="flex sm:hidden items-center gap-2 text-neutral-700 font-medium">
              <ShoppingCart className="w-5 h-5" />
              Cart
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

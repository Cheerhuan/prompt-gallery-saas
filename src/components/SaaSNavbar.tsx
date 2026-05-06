import React from 'react';
import Link from 'next/link';

export const SaaSNavbar = ({ userTier = 'free' }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-black/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black text-xs">PG</span>
            </div>
            <span>PROMPT GALLERY</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/trending" className="hover:text-white transition-colors">Trending</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userTier === 'free' && (
            <Link 
              href="/pricing" 
              className="hidden sm:block text-xs font-medium px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white animate-pulse"
            >
              Upgrade to Pro
            </Link>
          )}
          <button className="text-sm text-zinc-400 hover:text-white transition-colors">Login</button>
          <button className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-zinc-200 transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

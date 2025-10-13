"use client"
import React, { useState } from 'react';
// Import icons from lucide-react
import { 
  CheckCircle, 
  XCircle, 
  Link, 
  Pencil, 
  Zap,
} from 'lucide-react';
// 👈 REMOVED: Clerk components imports

// Define the interface for the API response
interface ShortenUrlResponse {
  shortUrl: string;
}

// ------------------------------------------------------------------
// --- 1. Shortener Form Component (Your core logic) ---
// ------------------------------------------------------------------
const ShortenerForm = () => {
    const [longUrlInput, setLongUrlInput] = useState<string>('');
    const [customCodeInput, setCustomCodeInput] = useState<string>('');
    const [shortenedUrl, setShortenedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getLongUrlInp = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLongUrlInput(e.target.value);
    }

    const getCustomCodeInp = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomCodeInput(e.target.value);
    }

    const handleSubmit = async () => {
      setIsLoading(true);
      setError(null);
      setShortenedUrl(null);

      const payload = {
        longUrl: longUrlInput,
        customCode: customCodeInput.trim() 
      };

      try {
        // NOTE: This fetch call assumes you have an API route set up at /api/shortner
        // The API route would now need to be unprotected if you rely on this logic
        const response = await fetch('/api/shortner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        if (!response.ok) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.error || 'Unknown server error.');
          } catch {
            throw new Error(`Something went wrong. Server error status: ${response.status}`);
          }
        }

        const data: ShortenUrlResponse = JSON.parse(responseText);
        setShortenedUrl(data.shortUrl);
        
        setLongUrlInput('');
        setCustomCodeInput('');

      } catch (err: unknown) { // FIX: Changed 'any' to 'unknown'
        // FIX: Safely check if the caught error is an instance of Error
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred during the shortening process.');
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    // Form container now bg-gray-950/70 for a darker monochrome feel
    return (
        <div className='flex flex-col items-center w-full p-8 bg-gray-950/70 border border-gray-800 rounded-xl shadow-2xl shadow-gray-950/50'>
            {/* Long URL Input */}
            <label htmlFor="long-url" className="text-left w-full text-gray-400 font-medium mb-2">
                Paste your Long URL
            </label>
            <input 
              id="long-url"
              type="url"
              placeholder="https://www.long-url-here.com/..."
              className='p-4 border border-gray-700 bg-gray-800 rounded-lg w-full text-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150' 
              onChange={getLongUrlInp}
              value={longUrlInput}
              disabled={isLoading}
            />

            {/* Custom Code Input */}
            <label htmlFor="custom-code" className="text-left w-full text-gray-400 font-medium mt-6 mb-2">
                Custom Short Code <span className='text-sm text-gray-500 font-normal ml-1'>(Optional)</span>
            </label>
            <div className='flex items-center w-full bg-gray-800 border border-gray-700 rounded-lg'>
                <span className='pl-4 text-gray-500 font-mono select-none'>
                    shorty.co/
                </span>
                <input 
                    id="custom-code"
                    type="text"
                    placeholder="auto-generated"
                    className='p-4 bg-transparent rounded-r-lg w-full text-gray-50 placeholder-gray-600 focus:outline-none' 
                    onChange={getCustomCodeInp}
                    value={customCodeInput}
                    disabled={isLoading}
                />
            </div>
            
            {/* Submit Button */}
            <button 
              onClick={handleSubmit}
              className='mt-8 w-full px-6 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              disabled={!longUrlInput || isLoading}
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Shortening...
                </div>
              ) : 'Create Short Link'}
            </button>

            {/* Success Output (Monochrome with Icon) */}
            {shortenedUrl && (
                <div className='mt-8 p-6 bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg w-full text-center shadow-lg animate-fade-in'>
                  <p className='text-lg mb-2 font-medium text-white flex items-center justify-center'>
                     <CheckCircle className="w-5 h-5 mr-2 text-white" /> Success! Your Link is Ready:
                  </p>
                  <a 
                    href={shortenedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className='font-mono text-xl text-white break-all underline decoration-white hover:text-gray-300 transition duration-200'
                  >
                    {shortenedUrl}
                  </a>
                </div>
            )}

            {/* Error Output (Monochrome with Icon) */}
            {error && (
                <div className='mt-8 p-6 bg-gray-900/70 text-gray-200 border border-gray-600 rounded-lg w-full text-center shadow-lg animate-fade-in'>
                  <p className='font-semibold text-lg text-white flex items-center justify-center'>
                    <XCircle className="w-5 h-5 mr-2 text-white" /> Error:
                  </p>
                  <p className='text-gray-300 mt-1'>{error}</p>
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------------
// --- 2. Landing Page Layout Component (Clerk-free) ---
// ------------------------------------------------------------------

const LandingPage = () => {
    return (
        <div className='flex flex-col items-center min-h-screen bg-black text-white font-sans'>
            
            {/* Header/Nav - CLEANED UP */}
            <header className="w-full max-w-7xl p-4 md:p-8 flex justify-between items-center z-10">
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-50 to-gray-400">
                    Shortyy
                </div>
                {/* 👈 REMOVED: Clerk Auth Buttons - leaving an empty div for layout stability */}
                <div className="flex items-center space-x-4">
                    {/* Optionally, you could add a static link here */}
                </div>
            </header>

            {/* Hero Section */}
            <section className="w-full max-w-3xl text-center py-20 px-4">
                <h1 className='text-6xl md:text-8xl font-extrabold tracking-tighter mb-4 leading-tight'>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-50 to-gray-400">
                        Shorten
                    </span>{' '}
                    Any Link. <br className="hidden md:inline"/>Instantly.
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-50 to-gray-400 text-xl md:text-xl font-extrabold tracking-tighter mb-4 leading-tight">
                        Shortyy
                    </span>{' '}provides fast, customizable, and reliable short links to track and share your digital content effortlessly.
                </p>

                {/* Main CTA / Form Placement - ALWAYS VISIBLE */}
                <div id="form" className="w-full max-w-xl mx-auto mb-16">
                    {/* 👈 DIRECTLY RENDER SHORTENER FORM */}
                    <ShortenerForm />
                </div>
            </section>

            <hr className='w-full max-w-6xl border-gray-900'/>
            
            {/* Features Section */}
            <section className="w-full max-w-6xl py-20 px-4">
                <h2 className="text-4xl font-bold text-center mb-16">
                    Why Use  <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-50 to-gray-400 text-4xl md:text-4xl font-extrabold tracking-tighter mb-4 leading-tight">
                        Shortyy
                    </span>?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1: Clean Links */}
                    <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl transition duration-300 hover:border-blue-600/50">
                        <Link className="w-8 h-8 mb-3 text-blue-500" />
                        <h3 className="text-xl font-semibold mb-2 text-white">Clean Links</h3>
                        <p className="text-gray-400">
                            Eliminate messy, long URLs. Present your links professionally in all your communications.
                        </p>
                    </div>
                    {/* Feature 2: Custom Codes */}
                    <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl transition duration-300 hover:border-blue-600/50">
                        <Pencil className="w-8 h-8 mb-3 text-blue-500" />
                        <h3 className="text-xl font-semibold mb-2 text-white">Custom Codes</h3>
                        <p className="text-gray-400">
                            Personalize your link with memorable, brandable short codes, increasing click-through rates.
                        </p>
                    </div>
                    {/* Feature 3: Speed & Reliability */}
                    <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl transition duration-300 hover:border-blue-600/50">
                        <Zap className="w-8 h-8 mb-3 text-blue-500" />
                        <h3 className="text-xl font-semibold mb-2 text-white">Instant Redirects</h3>
                        <p className="text-gray-400">
                            Built for speed. Our infrastructure ensures your users are redirected instantly and reliably.
                        </p>
                    </div>
                </div>
            </section>
            
            <hr className='w-full max-w-6xl border-gray-900'/>

            {/* Footer */}
            <footer className="w-full border-t border-gray-900 p-8 mt-16 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Shorty. Built with <span className="text-blue-500">Next.js & Tailwind CSS</span>.</p>
            </footer>
            
            {/* Animation Styles */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    )
}

export default LandingPage;
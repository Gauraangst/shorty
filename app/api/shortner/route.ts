// app/api/shortner/route.ts (CLERK-FREE)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
// 👈 REMOVED: import { auth } from '@clerk/nextjs/server'; 

// 1. Define the type for the expected request body
interface RequestBody {
  longUrl: string;
  customCode?: string;
}

// 2. Define a function to securely initialize the Supabase client
const getSupabaseClient = (): SupabaseClient => {
  // NOTE: You must use the Service Role Key for secure server-side writes
  // that need to bypass Row Level Security (RLS) or to access protected data.
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Recommended for server actions/routes

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set. Ensure SUPABASE_PROJECT_URL and SUPABASE_SERVICE_KEY are available.');
  }

  // Use the Service Role Key for server-side operations
  return createClient(supabaseUrl, supabaseServiceKey);
};

// 3. Placeholder for a simple URL validation
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

// 4. Simple short code generator
const generateShortCode = (): string => {
  return Math.random().toString(36).substring(2, 8);
}

// 5. Function to check if a short code is already in use
async function isCodeTaken(supabase: SupabaseClient, code: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('urls')
    .select('short_code', { count: 'exact', head: true })
    .eq('short_code', code);
    
  if (error) throw error;
  
  return (count as number) > 0;
}

// 6. POST handler for the API route
export async function POST(req: NextRequest) {
  // Authentication check removed (Clerk-free)

  const supabase = getSupabaseClient();
    
  try {
    const { longUrl, customCode }: RequestBody = await req.json();

    if (!longUrl) {
      return NextResponse.json({ error: 'Missing longUrl in request body.' }, { status: 400 });
    }

    if (!isValidUrl(longUrl)) {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }
    
    let shortCode = '';

    // A. Handle Custom Code
    if (customCode && customCode.trim()) {
      const sanitizedCode = customCode.trim().toLowerCase().replace(/\s/g, '-');
        
      // Basic validation for custom code
      if (sanitizedCode.length < 3 || !/^[a-z0-9_-]+$/.test(sanitizedCode)) {
           return NextResponse.json({ error: 'Custom code must be at least 3 characters long and contain only letters, numbers, hyphens, or underscores.' }, { status: 400 });
      }

      const isTaken = await isCodeTaken(supabase, sanitizedCode);

      if (isTaken) {
        return NextResponse.json({ error: `The custom short code '/${sanitizedCode}' is already taken. Please choose another.` }, { status: 409 }); 
      }

      shortCode = sanitizedCode;

    } else {
    // B. Handle Auto-Generated Code (with retry logic)
        
      let attempts = 0;
      const MAX_ATTEMPTS = 5;
        
      do {
        shortCode = generateShortCode();
        if (!(await isCodeTaken(supabase, shortCode))) {
          break; 
        }
        attempts++;
      } while (attempts < MAX_ATTEMPTS);

      if (attempts === MAX_ATTEMPTS) {
           return NextResponse.json({ error: 'Failed to generate a unique short code after several attempts.' }, { status: 500 });
      }
    }
        
    // Insert the new URL record (without user_id)
    const { data, error } = await supabase
      .from('urls')
      .insert({ 
        long_url: longUrl, 
        short_code: shortCode,
        created_at: new Date().toISOString(), 
      })
      .select('short_code')
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: 'Database operation failed.' }, { status: 500 });
    }
        
    // Construct the full short URL
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || '/';
    const shortUrl = `${baseDomain}${data.short_code}`;

    // Return the successful response
    return NextResponse.json({ shortUrl }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
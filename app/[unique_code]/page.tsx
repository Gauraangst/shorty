import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';

// 1. Define Props type for Next.js Dynamic Route Segment
interface UrlRedirectPageProps {
  params: {
    unique_code: string;
  };
}

// 2. Secure Supabase Client Initialization (Same as in API route)
const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // This should ideally be handled at build/deployment time
    throw new Error('Supabase environment variables are not set for the redirect page.');
  }

  // NOTE: For server components, the service role key might be preferred
  // if you want to bypass RLS, but the anon key works if RLS is configured.
  return createClient(supabaseUrl, supabaseAnonKey);
};

// 3. Server Component to Handle Lookup and Redirection
export default async function UrlRedirectPage({ params }: UrlRedirectPageProps) {
  const { unique_code } = params;
  const supabase = getSupabaseClient();
  
  // 3.1. Lookup the long URL in the database
  const { data, error } = await supabase
    .from('urls')
    .select('long_url')
    .eq('short_code', unique_code)
    .maybeSingle(); // Use maybeSingle to get one row or null

  if (error) {
    console.error('Supabase lookup error:', error);
    // You could render an error page here, but notFound is simpler
    return notFound(); 
  }

  // 3.2. Handle case where the short code doesn't exist
  if (!data) {
    return notFound(); // Show the default Next.js 404 page
  }

  // 3.3. Perform the redirect
  // Use Next.js 'redirect' for a permanent (301) or temporary (302) redirect.
  // We use 302 (temporary) which is standard for shorteners, but 301 is also common.
  // The 'redirect' function throws an error internally which Next.js catches to perform the redirect.
  redirect(data.long_url);

  // This part is unreachable due to redirect(), but TypeScript requires a return
  return <></>;
}

// 4. Optional: Generate static paths for better performance (SSG)
// If you have a small, mostly static set of URLs, you can uncomment this.
// For a high-traffic dynamic shortener, you'd typically rely on SSR/ISR.
/*
export async function generateStaticParams() {
  const supabase = getSupabaseClient();
  const { data: urls } = await supabase.from('urls').select('short_code');
  
  if (!urls) {
    return [];
  }

  return urls.map((url) => ({
    unique_code: url.short_code,
  }));
}
*/
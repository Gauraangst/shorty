// app/api/sync-user/route.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Define the expected data structure from the request body
interface UserSyncData {
  email: string;
  fullName: string;
}

// Function to securely initialize the Supabase client
const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  // IMPORTANT: Use the Service Role Key for secure server-side writes
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables are not set. Check SUPABASE_PROJECT_URL and SUPABASE_SERVICE_KEY.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: NextRequest) {
  // 1. Enforce authentication using Clerk
  // FIX: Await the auth() function as its type signature is Promise<...> in your environment.
  const { userId } = await auth(); 

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  
  try {
    const { email, fullName }: UserSyncData = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // 2. Perform Upsert (Insert or Update) into the 'users' table
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          clerk_user_id: userId, // Match the user ID from Clerk
          email: email, 
          full_name: fullName,
        }, 
        { 
          onConflict: 'clerk_user_id', // Target the unique Clerk ID column for conflict resolution
          ignoreDuplicates: false
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Supabase Upsert Error:', error);
      return NextResponse.json({ error: 'Failed to synchronize user with Supabase.' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'User synchronized successfully', user: data }, { status: 200 });

  } catch (error) {
    console.error('User Sync API Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
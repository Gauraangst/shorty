// app/components/UserSyncer.tsx (UPDATED)

"use client";
// 👈 Import useAuth
import { useUser, useAuth } from "@clerk/nextjs"; 
import { useEffect, useRef } from "react";

const UserSyncer = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  // 👈 Access getToken for authorization
  const { getToken } = useAuth(); 
  const syncAttempted = useRef(false);

  useEffect(() => {
    // Only proceed if user data is loaded, signed in, and sync hasn't been attempted
    if (isLoaded && isSignedIn && user && !syncAttempted.current) {
      const syncUser = async () => {
        syncAttempted.current = true; // Mark as attempted

        // 👈 Get the session token
        const token = await getToken({ template: 'supabase' }); 
        
        // Prepare user data for the /api/sync-user endpoint
        const userData = {
          email: user.emailAddresses[0]?.emailAddress || '',
          fullName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
        };

        try {
          const response = await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 👈 PASS THE AUTH TOKEN IN THE HEADER
              'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            // Keep the detailed error logging
            console.error("Failed to sync user to Supabase:", response.status, await response.text());
          } else {
            console.log("User synchronized with Supabase successfully.");
          }
        } catch (error) {
          console.error("Error during user synchronization:", error);
        }
      };

      syncUser();
    }
  }, [isLoaded, isSignedIn, user, getToken]); // 👈 Add getToken to dependencies

  return null;
};

export default UserSyncer;
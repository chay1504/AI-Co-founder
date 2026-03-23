// src/utils/clerk.ts

import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Verifies a Clerk JWT token and returns the user object.
 * As per the roadmap, this is used for every feature endpoint.
 */
export const verifyClerkToken = async (token: string) => {
  try {
    const verifiedSession = await clerk.sessions.verifySession(token, token);
    
    if (!verifiedSession) {
      return null;
    }
    
    // Return a simplified user object for req.user
    return {
      session_id: verifiedSession.id,
      user_id: verifiedSession.userId,
      // More user data could be fetched here with clerk.users.getUser()
    };
    
  } catch (error) {
    console.error('Clerk Verification Error:', error);
    return null;
  }
};

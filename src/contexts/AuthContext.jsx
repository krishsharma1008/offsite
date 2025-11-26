import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getUserPhotoCount } from '../lib/supabase';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);

  // Fetch user profile
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    return data;
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Helper to handle session and load profile/photo count
    const handleSession = async (session, source) => {
      console.log(`[Auth] handleSession from ${source}:`, { hasSession: !!session, userId: session?.user?.id });
      
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Fetch profile and photo count in background (non-blocking)
        Promise.allSettled([
          fetchProfile(session.user.id),
          getUserPhotoCount(session.user.id)
        ]).then(([profileResult, countResult]) => {
          if (!mounted) return;
          if (profileResult.status === 'fulfilled') {
            console.log('[Auth] Profile loaded:', profileResult.value);
            setProfile(profileResult.value);
          }
          if (countResult.status === 'fulfilled') {
            console.log('[Auth] Photo count loaded:', countResult.value);
            setPhotoCount(countResult.value);
          }
        });
      } else {
        setProfile(null);
        setPhotoCount(0);
      }
    };

    // Set up auth state change listener FIRST
    // This will fire immediately if there's an existing session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, { hasSession: !!session, userId: session?.user?.id });
        await handleSession(session, `onAuthStateChange:${event}`);
      }
    );

    // Also call getSession for initial state (handles edge cases)
    const initAuth = async () => {
      console.log('[Auth] Starting initAuth...');
      try {
        console.log('[Auth] Calling getSession...');
        const { data, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        console.log('[Auth] getSession complete:', { hasSession: !!data?.session, error });
        
        if (error) {
          console.error('Auth session error:', error);
          setLoading(false);
          return;
        }
        
        // Only set loading=false here if we don't have a session
        // (onAuthStateChange will handle it if we do have a session)
        if (!data?.session) {
          console.log('[Auth] No session found, setting loading=false');
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setLoading(false);
      }
    };
    
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email/password
  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setProfile(null);
    setPhotoCount(0);
  };

  // Refresh photo count
  const refreshPhotoCount = async () => {
    if (user) {
      const count = await getUserPhotoCount(user.id);
      setPhotoCount(count);
      return count;
    }
    return 0;
  };

  // Check if user can take more photos
  const canTakePhoto = () => {
    return photoCount < 10;
  };

  // Get remaining photo count
  const getRemainingPhotos = () => {
    return Math.max(0, 10 - photoCount);
  };

  const value = {
    user,
    profile,
    loading,
    photoCount,
    signUp,
    signIn,
    signOut,
    refreshPhotoCount,
    canTakePhoto,
    getRemainingPhotos
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


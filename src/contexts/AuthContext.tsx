import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'owner' | 'admin' | 'staff';
    is_active: boolean;
    invited_by: string | null;
    last_sign_in_at: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    inviteUser: (email: string, fullName: string, role: 'owner' | 'admin' | 'staff') => Promise<{ error: Error | null }>;
    updateUserRole: (userId: string, newRole: 'owner' | 'admin' | 'staff') => Promise<{ error: Error | null }>;
    deactivateUser: (userId: string) => Promise<{ error: Error | null }>;
    isOwner: () => boolean;
    isAdminOrOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const profileRef = useRef<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from database
    const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
        try {
            console.log('Fetching profile for user:', userId);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('Error fetching profile:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    userId
                });

                // Check if it's an RLS policy violation
                if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
                    console.error('RLS Policy may be blocking profile access. Check that user is_active and RLS policies are correct.');
                }

                return null;
            }

            if (!data) {
                console.error('Profile fetch returned no data for user:', userId);
                console.error('This may indicate the user does not exist in profiles table or is inactive.');
                return null;
            }

            console.log('Profile fetched successfully:', data);
            return data as UserProfile;
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
            return null;
        }
    };

    // Keep profileRef in sync with profile state for use in callbacks
    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    // Initialize auth state
    useEffect(() => {
        let isInitialLoad = true;
        let profileFetchTimeout: NodeJS.Timeout | null = null;

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            console.log('Initial session check:', session?.user?.id || 'No session');
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                const userProfile = await fetchProfile(session.user.id);

                if (!userProfile) {
                    console.warn('No profile found for user during initial load - user may need to set password');
                    // Don't sign out immediately - user might be in password setup flow
                    // Profile will be checked again by ProtectedRoute
                    setProfile(null);
                } else {
                    setProfile(userProfile);
                }
            }

            isInitialLoad = false;
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, 'Session:', session?.user?.id);

            // Skip if this is the initial load (already handled above)
            if (isInitialLoad) {
                console.log('Skipping onAuthStateChange during initial load');
                return;
            }

            // Handle INITIAL_SESSION - Supabase v2 fires this when recovering session from storage
            // This is already handled by getSession() above, so skip it
            if (event === 'INITIAL_SESSION') {
                console.log('Skipping INITIAL_SESSION event (handled by getSession)');
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
                return;
            }

            // Don't try to fetch profile during sign-out, token refresh, or user update events
            // This prevents infinite loops when profile fetch fails
            // USER_UPDATED is fired when password is set - no need to refetch profile
            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                console.log('Handling sign-out, token refresh, or user update event');
                setSession(session);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }

                setIsLoading(false);
                return;
            }

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // If we already have a valid profile for this user, don't re-fetch
                // This prevents unnecessary fetches on tab switch or session recovery
                if (profileRef.current && profileRef.current.id === session.user.id) {
                    console.log('Profile already loaded for user, skipping fetch');
                    setIsLoading(false);
                    return;
                }

                // Keep loading state true while fetching profile
                setIsLoading(true);

                const userProfile = await fetchProfile(session.user.id);
                console.log('Setting profile from auth state change:', userProfile);

                if (!userProfile) {
                    console.error('Failed to fetch profile after auth state change');
                    // Don't clear user/session - this causes cascading auth events
                    // Just set profile to null and let ProtectedRoute handle the redirect
                    setProfile(null);
                } else {
                    setProfile(userProfile);
                }

                setIsLoading(false);
            } else {
                setProfile(null);
                setIsLoading(false);
            }
        });

        return () => {
            if (profileFetchTimeout) {
                clearTimeout(profileFetchTimeout);
            }
            subscription.unsubscribe();
        };
    }, []);

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error };
            }

            // Profile will be fetched automatically by onAuthStateChange
            return { error: null };
        } catch (error) {
            return { error: error as AuthError };
        }
    };

    // Sign out
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    // Invite a new user (admin/owner only)
    const inviteUser = async (
        email: string,
        fullName: string,
        role: 'owner' | 'admin' | 'staff'
    ) => {
        try {
            // Check if current user can manage users
            if (!isAdminOrOwner()) {
                return { error: new Error('Unauthorized: Only admins and owners can invite users') };
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: new Error('Not authenticated') };
            }

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: {
                    email,
                    full_name: fullName,
                    role
                }
            });

            if (error) {
                console.error('Error inviting user:', error);
                return { error: new Error(error.message) };
            }

            if (data?.error) {
                return { error: new Error(data.error) };
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Update user role (owner only)
    const updateUserRole = async (userId: string, newRole: 'owner' | 'admin' | 'staff') => {
        try {
            if (!isOwner()) {
                return { error: new Error('Unauthorized: Only owners can change user roles') };
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: new Error('Not authenticated') };
            }

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('update-user-role', {
                body: {
                    user_id: userId,
                    new_role: newRole
                }
            });

            if (error) {
                console.error('Error updating role:', error);
                return { error: new Error(error.message) };
            }

            if (data?.error) {
                return { error: new Error(data.error) };
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Deactivate user (owner only)
    const deactivateUser = async (userId: string) => {
        try {
            if (!isOwner()) {
                return { error: new Error('Unauthorized: Only owners can deactivate users') };
            }

            // Prevent self-deactivation
            if (userId === user?.id) {
                return { error: new Error('Cannot deactivate your own account') };
            }

            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return { error: new Error('Not authenticated') };
            }

            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('deactivate-user', {
                body: {
                    user_id: userId
                }
            });

            if (error) {
                console.error('Error deactivating user:', error);
                return { error: new Error(error.message) };
            }

            if (data?.error) {
                return { error: new Error(data.error) };
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Check if current user is owner
    const isOwner = (): boolean => {
        return profile?.role === 'owner' && profile?.is_active === true;
    };

    // Check if current user is admin or owner
    const isAdminOrOwner = (): boolean => {
        return (
            (profile?.role === 'admin' || profile?.role === 'owner') &&
            profile?.is_active === true
        );
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        signIn,
        signOut,
        inviteUser,
        updateUserRole,
        deactivateUser,
        isOwner,
        isAdminOrOwner,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

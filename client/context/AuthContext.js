import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        // Check for an existing session
        async function getSession() {

            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                console.log('Session error:', error.message);
            }

            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }

        getSession();

        // Listen for authentication changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {

                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);

            }
        );

        return () => {
            subscription.unsubscribe();
        };

    }, []);

    async function signOut() {

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.log('Sign out error:', error.message);
        }
    }

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                loading,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside an AuthProvider'
        );
    }

    return context;
}
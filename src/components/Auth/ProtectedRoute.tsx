import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: 'owner' | 'admin' | 'staff';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
    const { user, profile, isLoading } = useAuth();
    const [profileTimeout, setProfileTimeout] = React.useState(false);

    // Set a timeout for profile loading
    React.useEffect(() => {
        if (user && !profile && !isLoading) {
            console.warn('User exists but profile is missing. Auth state:', {
                userId: user.id,
                hasProfile: !!profile,
                isLoading
            });

            const timer = setTimeout(async () => {
                console.error('Profile loading timeout - signing out and redirecting to login');
                console.error('This usually indicates a profile fetch failure. Check browser console for errors from AuthContext.');

                // Sign out to clear cookies before redirecting
                const { supabase } = await import('../../lib/supabase');
                await supabase.auth.signOut();

                setProfileTimeout(true);
            }, 5000); // 5 second timeout

            return () => clearTimeout(timer);
        }
    }, [user, profile, isLoading]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
            </div>
        );
    }

    // Redirect to login if not authenticated or profile timeout
    if (!user || profileTimeout) {
        return <Navigate to="/login" replace />;
    }

    // If user exists but profile is still loading, show loading screen
    if (user && !profile) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }}></div>
            </div>
        );
    }

    // Check if user is active
    if (!profile!.is_active) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    maxWidth: '500px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{
                        fontSize: '4rem',
                        marginBottom: '1rem'
                    }}>🚫</div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginBottom: '1rem',
                        color: '#1f2937'
                    }}>الحساب غير نشط</h2>
                    <p style={{
                        color: '#6b7280',
                        marginBottom: '2rem'
                    }}>
                        تم إلغاء تفعيل حسابك. يرجى التواصل مع المسؤول لمزيد من المعلومات.
                    </p>
                </div>
            </div>
        );
    }

    // Check role-based access
    if (requireRole) {
        const hasAccess =
            requireRole === 'staff' ? true :
                requireRole === 'admin' ? (profile!.role === 'admin' || profile!.role === 'owner') :
                    requireRole === 'owner' ? profile!.role === 'owner' :
                        false;

        if (!hasAccess) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        maxWidth: '500px',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            marginBottom: '1rem'
                        }}>⛔</div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            marginBottom: '1rem',
                            color: '#1f2937'
                        }}>غير مصرح</h2>
                        <p style={{
                            color: '#6b7280',
                            marginBottom: '2rem'
                        }}>
                            ليس لديك صلاحية للوصول إلى هذه الصفحة.
                        </p>
                        <a
                            href="/"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 2rem',
                                background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '12px',
                                fontWeight: '600'
                            }}
                        >
                            العودة إلى الصفحة الرئيسية
                        </a>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};

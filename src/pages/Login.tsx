import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import styles from './Login.module.css';

export const Login: React.FC = () => {
    const { signIn, user, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (user && !isLoading) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message === 'Invalid login credentials'
                ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                : 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
            setLoading(false);
        }
        // No need to handle success - AuthContext will redirect automatically
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div className={styles.loginPage}>
            <div className={styles.background}>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
                <div className={styles.shape}></div>
            </div>

            <div className={styles.loginCard}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>ت</div>
                    <h1 className={styles.logoText}>تشويش</h1>
                </div>

                <div className={styles.header}>
                    <h2 className={styles.title}>مرحباً بعودتك</h2>
                    <p className={styles.subtitle}>قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        label="البريد الإلكتروني"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="example@tashweesh.com"
                    />

                    <Input
                        label="كلمة المرور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="••••••••"
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? (
                            <>
                                <span className={styles.buttonSpinner}></span>
                                جاري تسجيل الدخول...
                            </>
                        ) : (
                            'تسجيل الدخول'
                        )}
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        © 2026 Cyiper Devcode
                    </p>
                </div>
            </div>
        </div>
    );
};

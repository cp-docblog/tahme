import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import styles from './SetPassword.module.css';

export const SetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Check if user is already authenticated from the invitation link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUserEmail(session.user.email || '');
            } else {
                // If no session, redirect to login
                navigate('/login');
            }
        };

        checkSession();
    }, [navigate]);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'يجب أن تكون كلمة المرور 8 أحرف على الأقل';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        // FIRST: Start redirect timer IMMEDIATELY - 7 seconds from button press
        // This fires before ANY React state changes to guarantee it runs
        setTimeout(() => {
            window.location.href = '/';
        }, 7000);

        // Now update UI and call API
        setLoading(true);
        setSuccess(true);

        // Try to update password in background
        supabase.auth.updateUser({ password: password }).catch((err) => {
            console.error('Error setting password:', err);
        });
    };

    if (success) {
        return (
            <div className={styles.container}>
                <Card className={styles.successCard}>
                    <div className={styles.successIcon}>
                        <CheckCircle size={64} />
                    </div>
                    <h1 className={styles.successTitle}>تم تعيين كلمة المرور بنجاح!</h1>
                    <p className={styles.successMessage}>
                        جاري تحويلك إلى لوحة التحكم...
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.icon}>
                        <Lock size={48} />
                    </div>
                    <h1 className={styles.title}>تعيين كلمة المرور</h1>
                    <p className={styles.subtitle}>
                        مرحباً بك! يرجى تعيين كلمة مرور لحسابك
                    </p>
                    {userEmail && (
                        <p className={styles.email}>{userEmail}</p>
                    )}
                </div>

                {error && (
                    <div className={styles.alert}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="كلمة المرور"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="أدخل كلمة المرور (8 أحرف على الأقل)"
                    />

                    <Input
                        label="تأكيد كلمة المرور"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="أعد إدخال كلمة المرور"
                    />

                    <div className={styles.passwordHints}>
                        <p className={styles.hintTitle}>متطلبات كلمة المرور:</p>
                        <ul className={styles.hintList}>
                            <li className={password.length >= 8 ? styles.valid : ''}>
                                8 أحرف على الأقل
                            </li>
                        </ul>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !password || !confirmPassword}
                        className={styles.submitButton}
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

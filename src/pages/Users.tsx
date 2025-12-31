import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, ShieldCheck, User as UserIcon, Mail, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import styles from './Users.module.css';

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: 'owner' | 'admin' | 'staff';
    is_active: boolean;
    invited_by: string | null;
    last_sign_in_at: string | null;
    created_at: string;
}

export const Users: React.FC = () => {
    const { profile, inviteUser, updateUserRole, deactivateUser, isOwner, isAdminOrOwner } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newUser, setNewUser] = useState({
        email: '',
        full_name: '',
        role: 'staff' as 'owner' | 'admin' | 'staff',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('فشل تحميل المستخدمين');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setInviteLoading(true);

        try {
            const { error: inviteError } = await inviteUser(
                newUser.email,
                newUser.full_name,
                newUser.role
            );

            if (inviteError) {
                setError(inviteError.message || 'فشل إرسال الدعوة');
                setInviteLoading(false);
                return;
            }

            setSuccess('تم إرسال الدعوة بنجاح!');
            setShowInviteModal(false);
            setNewUser({ email: '', full_name: '', role: 'staff' });

            // Fetch users in the background
            fetchUsers().catch(err => {
                console.error('Error refreshing users list:', err);
            });
        } catch (err) {
            console.error('Unexpected error during invite:', err);
            setError('حدث خطأ غير متوقع');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'owner' | 'admin' | 'staff') => {
        const { error } = await updateUserRole(userId, newRole);

        if (error) {
            setError(error.message);
        } else {
            setSuccess('تم تحديث الصلاحية بنجاح');
            fetchUsers();
        }
    };

    const handleDeactivate = async (userId: string) => {
        if (!window.confirm('هل أنت متأكد من إلغاء تفعيل هذا المستخدم؟')) {
            return;
        }

        const { error } = await deactivateUser(userId);

        if (error) {
            setError(error.message);
        } else {
            setSuccess('تم إلغاء تفعيل المستخدم');
            fetchUsers();
        }
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            owner: { label: 'مالك', color: 'var(--color-primary)', icon: ShieldCheck },
            admin: { label: 'مدير', color: 'var(--color-warning)', icon: Shield },
            staff: { label: 'موظف', color: 'var(--color-success)', icon: UserIcon },
        };
        return badges[role as keyof typeof badges] || badges.staff;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isAdminOrOwner()) {
        return (
            <div className={styles.unauthorized}>
                <div className={styles.unauthorizedIcon}>⛔</div>
                <h2>غير مصرح</h2>
                <p>ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
            </div>
        );
    }

    return (
        <div className={styles.users}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>إدارة المستخدمين</h1>
                    <p className={styles.subtitle}>
                        إدارة المستخدمين والصلاحيات في النظام
                    </p>
                </div>
                {isAdminOrOwner() && (
                    <Button onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={18} style={{ marginInlineEnd: '0.5rem' }} />
                        دعوة مستخدم
                    </Button>
                )}
            </div>

            {error && (
                <div className={styles.alert} style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                    {error}
                </div>
            )}

            {success && (
                <div className={styles.alert} style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                    {success}
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>جاري التحميل...</p>
                </div>
            ) : (
                <div className={styles.usersGrid}>
                    {users.map((user) => {
                        const badge = getRoleBadge(user.role);
                        const Icon = badge.icon;

                        return (
                            <Card key={user.id} className={`${styles.userCard} ${!user.is_active ? styles.inactive : ''}`} hover>
                                <div className={styles.userHeader}>
                                    <div className={styles.userAvatar}>
                                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                                    </div>
                                    <div className={styles.userInfo}>
                                        <h3 className={styles.userName}>
                                            {user.full_name || 'بدون اسم'}
                                            {!user.is_active && (
                                                <span className={styles.inactiveBadge}>غير نشط</span>
                                            )}
                                        </h3>
                                        <p className={styles.userEmail}>
                                            <Mail size={14} />
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.userDetails}>
                                    <div className={styles.detailItem}>
                                        <Icon size={16} />
                                        {isOwner() ? (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                                                className={styles.roleSelect}
                                                style={{ color: badge.color }}
                                                disabled={user.id === profile?.id}
                                            >
                                                <option value="staff">موظف</option>
                                                <option value="admin">مدير</option>
                                                <option value="owner">مالك</option>
                                            </select>
                                        ) : (
                                            <span style={{ color: badge.color, fontWeight: 600 }}>
                                                {badge.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.detailItem}>
                                        <Calendar size={16} />
                                        <span className={styles.detailText}>
                                            {formatDate(user.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {user.last_sign_in_at && (
                                    <div className={styles.lastLogin}>
                                        آخر تسجيل دخول: {formatDate(user.last_sign_in_at)}
                                    </div>
                                )}

                                {isOwner() && user.id !== profile?.id && user.is_active && (
                                    <div className={styles.userActions}>
                                        <button
                                            className={styles.deactivateButton}
                                            onClick={() => handleDeactivate(user.id)}
                                        >
                                            <Trash2 size={16} />
                                            إلغاء التفعيل
                                        </button>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {showInviteModal && (
                <div className={styles.modal} onClick={() => setShowInviteModal(false)}>
                    <Card className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>دعوة مستخدم جديد</h2>
                        <p className={styles.modalSubtitle}>
                            سيتم إرسال رسالة دعوة إلى البريد الإلكتروني للمستخدم
                        </p>

                        <form onSubmit={handleInviteUser} className={styles.form}>
                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                required
                                disabled={inviteLoading}
                                placeholder="user@example.com"
                            />

                            <Input
                                label="الاسم الكامل"
                                type="text"
                                value={newUser.full_name}
                                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                required
                                disabled={inviteLoading}
                                placeholder="أدخل الاسم الكامل"
                            />

                            <div className={styles.inputWrapper}>
                                <label className={styles.label}>الصلاحية</label>
                                <select
                                    className={styles.select}
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                    disabled={inviteLoading}
                                >
                                    <option value="staff">موظف</option>
                                    <option value="admin">مدير</option>
                                    {isOwner() && <option value="owner">مالك</option>}
                                </select>
                            </div>

                            <div className={styles.modalActions}>
                                <Button type="submit" disabled={inviteLoading}>
                                    {inviteLoading ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    disabled={inviteLoading}
                                >
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

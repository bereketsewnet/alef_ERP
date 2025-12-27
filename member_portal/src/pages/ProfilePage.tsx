import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { User, Phone, Mail, Globe, Lock, ChevronRight, LogOut, Briefcase, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

export function ProfilePage() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Change Password State
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const handleLogout = async () => {
        setIsLoggingOut(true)
        await logout()
        navigate('/login')
    }

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'am' : 'en'
        i18n.changeLanguage(newLang)
        localStorage.setItem('language', newLang)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError(null)

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError(t('auth.passwordsDoNotMatch') || 'Passwords do not match')
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError(t('auth.passwordTooShort') || 'Password must be at least 6 characters')
            return
        }

        setIsChangingPassword(true)
        try {
            await import('@/api/endpoints/auth').then(m => m.authApi.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            ))
            setIsChangePasswordOpen(false)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            alert(t('profile.passwordChanged') || 'Password changed successfully')
        } catch (error: any) {
            setPasswordError(error.response?.data?.error || t('common.error') || 'Failed to change password')
        } finally {
            setIsChangingPassword(false)
        }
    }

    const employee = user?.employee

    return (
        <div className="space-y-4 pb-20">
            <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

            {/* Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('profile.personalInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            {employee?.profile_photo_url ? (
                                <img
                                    src={employee.profile_photo_url}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <User className="h-8 w-8 text-primary" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-lg">
                                {employee ? `${employee.first_name} ${employee.last_name}` : user?.email}
                            </p>
                            {employee && (
                                <p className="text-sm text-gray-500">{employee.employee_code}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span>{employee?.phone_number || user?.phone_number || '--'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <span>{employee?.email || user?.email || '--'}</span>
                        </div>

                        {/* Extended Employee Details */}
                        {employee && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                    <span>{employee.employment_status}</span>
                                </div>
                                {/* Accessing raw properties that might exist but not in strict interface if we didn't update types perfectly, 
                                    but usually better to check types. Employee table suggests 'hire_date'. */}
                                {(employee as any).hire_date && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            Hired: {format(new Date((employee as any).hire_date), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                </CardContent>
            </Card>

            {/* Emergency Contact */}
            {employee?.emergency_contact_name && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('profile.emergencyContact')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="font-medium">{employee.emergency_contact_name}</p>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <span>{employee.emergency_contact_phone}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{t('profile.settings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-gray-400" />
                            <span>{t('profile.language')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                {i18n.language === 'en' ? 'English' : 'አማርኛ'}
                            </span>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                    </button>

                    {/* Change Password */}
                    <button
                        onClick={() => setIsChangePasswordOpen(true)}
                        className="w-full flex items-center justify-between py-3 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                            <span>{t('profile.changePassword')}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                </CardContent>
            </Card>

            {/* Logout */}
            <Button
                variant="outline"
                className="w-full text-error border-error hover:bg-error/10"
                onClick={handleLogout}
                isLoading={isLoggingOut}
            >
                <LogOut className="h-5 w-5 mr-2" />
                {t('auth.logout')}
            </Button>

            {/* Change Password Modal */}
            {isChangePasswordOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('profile.changePassword')}</h3>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-4 space-y-4 bg-white dark:bg-gray-900">
                            {passwordError && (
                                <div className="text-sm text-error bg-error/10 p-2 rounded">
                                    {passwordError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    {t('profile.currentPassword') || 'Current Password'}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    {t('profile.newPassword') || 'New Password'}
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                    {t('profile.confirmPassword') || 'Confirm Password'}
                                </label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsChangePasswordOpen(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    isLoading={isChangingPassword}
                                >
                                    {t('common.save')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

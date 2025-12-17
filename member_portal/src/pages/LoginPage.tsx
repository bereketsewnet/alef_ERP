import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormData {
    phone: string
    password: string
}

export function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>()

    const onSubmit = async (data: LoginFormData) => {
        setError('')
        setIsLoading(true)

        try {
            await login(data.phone, data.password)
            navigate('/')
        } catch {
            setError(t('auth.loginError'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-700 px-6 py-12">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <Shield className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
                    <p className="text-primary-200 mt-1">{t('auth.welcome')}</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-6 shadow-xl">
                    <div className="space-y-4">
                        <Input
                            label={t('auth.phone')}
                            type="tel"
                            placeholder="+251 9XX XXX XXX"
                            error={errors.phone?.message}
                            {...register('phone', { required: 'Phone is required' })}
                        />

                        <Input
                            label={t('auth.password')}
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password', { required: 'Password is required' })}
                        />

                        {error && (
                            <div className="text-error text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            isLoading={isLoading}
                        >
                            {t('auth.login')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

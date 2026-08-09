import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { User } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormData {
    phone: string
    password: string
}

const DEMO_MEMBERS = [
    { name: 'John Doe',   role: 'Security Guard', phone: '+251911234567', password: 'password123' },
    { name: 'Jane Smith', role: 'Cleaner',         phone: '+251922345678', password: 'password123' },
]

export function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
        defaultValues: { phone: '', password: '' },
    })

    const onSubmit = async (data: LoginFormData) => {
        setError('')
        setIsLoading(true)
        try {
            // Support local Ethiopian format: 09XXXXXXXX or 9XXXXXXXX → +2519XXXXXXXX
            let phone = data.phone ?? ''
            if (phone && !phone.startsWith('+')) {
                phone = '+251' + phone.replace(/^0/, '')
            }
            await login(phone, data.password)
            navigate('/')
        } catch {
            setError(t('auth.loginError'))
        } finally {
            setIsLoading(false)
        }
    }

    const fillDemo = (phone: string, password: string) => {
        setValue('phone', phone)
        setValue('password', password)
        setError('')
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-700 px-6 py-12">
            <div className="w-full max-w-sm">

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-full rounded-2xl bg-white p-4 shadow-lg mb-4">
                        <img src="/logo.svg" alt="Alef Delta Trading" className="mx-auto h-auto w-full max-w-[300px]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
                    <p className="text-primary-200 mt-1">{t('auth.welcome')}</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-6 shadow-xl">
                    <div className="space-y-4">

                        {/* Phone with country picker */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('auth.phone')}
                            </label>
                            <Controller
                                name="phone"
                                control={control}
                                rules={{ required: 'Phone number is required' }}
                                render={({ field }) => (
                                    <PhoneInput
                                        value={field.value}
                                        onChange={(val) => field.onChange(val ?? '')}
                                        defaultCountry="ET"
                                        international
                                        countryCallingCodeEditable={false}
                                        placeholder="09 12 345 678"
                                        className={[
                                            'phone-input-wrapper',
                                            errors.phone ? 'phone-input-error' : '',
                                        ].join(' ')}
                                    />
                                )}
                            />
                            {errors.phone && (
                                <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <Input
                            label={t('auth.password')}
                            type="password"
                            placeholder="••••••••"
                            error={errors.password?.message}
                            {...register('password', { required: 'Password is required' })}
                        />

                        {error && (
                            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">
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

                {/* Demo member accounts */}
                <div className="mt-5">
                    <div className="relative flex items-center mb-3">
                        <div className="flex-grow border-t border-white/30" />
                        <span className="mx-3 text-xs text-primary-100 whitespace-nowrap">Demo Accounts</span>
                        <div className="flex-grow border-t border-white/30" />
                    </div>
                    <div className="flex flex-col gap-2">
                        {DEMO_MEMBERS.map((m) => (
                            <button
                                key={m.phone}
                                type="button"
                                onClick={() => fillDemo(m.phone, m.password)}
                                className="flex items-center gap-3 w-full bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl px-4 py-3 text-left transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{m.name}</p>
                                    <p className="text-primary-200 text-xs">{m.role} · {m.phone}</p>
                                </div>
                                <span className="text-primary-200 text-xs flex-shrink-0">Tap to fill</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

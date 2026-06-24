'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Car,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  MapPin,
  Check,
} from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    shopPhone: '',
    address: '',
    city: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          shop_name: formData.shopName,
          phone: formData.phone,
          shop_phone: formData.shopPhone,
          address: formData.address,
          city: formData.city,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          name: formData.shopName,
          phone: formData.shopPhone,
          address: `${formData.address}, ${formData.city}`,
        })
        .eq('id', data.user.id)

      if (updateError) {
        console.error('Error updating tenant:', updateError)
      }
    }

    router.push('/onboarding')
    router.refresh()
  }

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const nextStep = () => {
    setError(null)
    if (validateStep1()) setStep(2)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a1b2e] via-[#252742] to-[#1a1b2e] relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">MotoRent</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start Growing Your
            <br />
            <span className="text-emerald-400">Rental Business</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-md">
            Join hundreds of Moroccan rental shops already using MotoRent to manage their fleet and boost revenue.
          </p>

          <div className="mt-12 space-y-4">
            {[
              '30-day free trial',
              'No credit card required',
              'WhatsApp reminders included',
              'Full Arabic & French support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Signup Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">MotoRent</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-1">30-day free trial &middot; No credit card required</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { num: 1, label: 'Account' },
              { num: 2, label: 'Shop' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center gap-3">
                {i > 0 && <div className={`w-8 h-px ${step >= 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      step >= s.num
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-sm font-medium ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Full name *</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Mohamed Benali"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Email address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Phone number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="+212 6XX-XXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-11 pr-12 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Min. 6 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Confirm password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm shadow-emerald-500/25 h-12"
                >
                  Next: Shop Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Shop name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="shopName"
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="Auto Location Casablanca"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Shop phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="shopPhone"
                      type="tel"
                      value={formData.shopPhone}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="+212 5XX-XXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-11 bg-gray-50/50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="123 Rue Mohammed V"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700">City</Label>
                  <Select value={formData.city} onValueChange={(value) => value && handleSelectChange('city', value)}>
                    <SelectTrigger className="bg-gray-50/50 border-gray-200 rounded-xl">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casablanca">Casablanca</SelectItem>
                      <SelectItem value="Rabat">Rabat</SelectItem>
                      <SelectItem value="Marrakech">Marrakech</SelectItem>
                      <SelectItem value="Fès">Fès</SelectItem>
                      <SelectItem value="Tangier">Tangier</SelectItem>
                      <SelectItem value="Agadir">Agadir</SelectItem>
                      <SelectItem value="Meknès">Meknès</SelectItem>
                      <SelectItem value="Oujda">Oujda</SelectItem>
                      <SelectItem value="Kenitra">Kenitra</SelectItem>
                      <SelectItem value="Tétouan">Tétouan</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-gray-200 rounded-xl h-12"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-sm shadow-emerald-500/25 h-12"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Car, MessageCircle, BarChart3, Check, ArrowRight } from 'lucide-react'

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MotoRent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-500/25 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Check className="w-4 h-4" />
              30-day free trial &middot; No credit card required
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight">
              Vehicle Rental
              <br />
              <span className="text-emerald-500">Made Simple</span>
            </h1>
            <p className="text-lg text-gray-500 mt-6 max-w-xl mx-auto leading-relaxed">
              The all-in-one platform for motorcycle and car rental shops in Morocco.
              Manage your fleet, track payments, and send WhatsApp reminders.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-8 py-3.5 rounded-xl shadow-sm shadow-emerald-500/25 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-6 py-3.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Car,
                title: 'Fleet Management',
                desc: 'Manage your vehicles, track maintenance, and monitor utilization with ease.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: MessageCircle,
                title: 'WhatsApp Reminders',
                desc: 'Automatically send payment reminders via WhatsApp. Never miss a payment.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: BarChart3,
                title: 'Business Insights',
                desc: 'Track revenue, monitor overdue payments, and get AI-powered recommendations.',
                color: 'bg-purple-50 text-purple-600',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:border-gray-200 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color} mb-5`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            &copy; 2026 MotoRent. Built for Moroccan rental shops.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-gray-600 transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

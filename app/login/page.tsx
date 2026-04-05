'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError('Hibás e-mail cím vagy jelszó!')
            setLoading(false)
        } else {
            router.push('/')
            router.refresh()
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <LogIn className="text-indigo-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Bejelentkezés</h1>
        <p className="text-slate-500 text-sm mt-2">Kérjük, adja meg belépési adatait.</p>
    </div>

    <form onSubmit={handleLogin} className="space-y-6">
        {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
                {error}
                </div>
        )}

    <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-700">E-mail cím</label>
    <div className="relative">
    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
    <input
        type="email"
    required
    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
    placeholder="pelda@ceg.hu"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    />
    </div>
    </div>

    <div className="space-y-2">
    <label className="text-sm font-semibold text-slate-700">Jelszó</label>
        <div className="relative">
    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
    <input
        type="password"
    required
    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-slate-900"
    placeholder="••••••••"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    />
    </div>
    </div>

    <button
    type="submit"
    disabled={loading}
    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-200 transition duration-200 disabled:opacity-50"
        >
        {loading ? 'Folyamatban...' : 'Belépés'}
        </button>
        </form>
        </div>
        </div>
)
}
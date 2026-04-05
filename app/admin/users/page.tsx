'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createNewUser } from './actions'
import { UserPlus, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react'

export default function AdminUserManagement() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // 1. Jogosultság ellenőrzése (Guard)
    useEffect(() => {
        async function checkAdmin() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                router.push('/')
            } else {
                setIsAdmin(true)
            }
        }
        checkAdmin()
    }, [router])

    // 2. Regisztrációs logika (JAVÍTVA)
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        // FONTOS: Elmentjük a form referenciáját az await ELŐTT!
        const form = e.currentTarget

        setLoading(true)
        setMsg(null)

        try {
            const formData = new FormData(form)
            const result = await createNewUser(formData)

            if (result.error) {
                setMsg({ type: 'error', text: result.error })
            } else {
                setMsg({ type: 'success', text: 'Felhasználó sikeresen létrehozva!' })
                // Itt már a korábban elmentett referenciát használjuk
                form.reset()
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Váratlan hiba történt a küldés során.' })
        } finally {
            setLoading(false)
        }
    }

    // Betöltési állapot
    if (isAdmin === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <ShieldAlert className="w-8 h-8 mr-3 text-indigo-400" />
                    Felhasználók kezelése
                </h1>
                <p className="text-slate-400 mt-2">Új munkatársak regisztrálása a rendszerbe.</p>
            </div>

            <div className="bg-white rounded-xl shadow-xl p-8 border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {msg && (
                        <div className={`p-4 rounded-lg flex items-center animate-in fade-in slide-in-from-top-1 ${
                            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                            {msg.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
                            {msg.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Teljes név</label>
                            <input
                                name="fullName"
                                required
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                placeholder="Kovács János"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Jogosultság</label>
                            <select
                                name="role"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                            >
                                <option value="viewer">Megtekintő (Viewer)</option>
                                <option value="admin">Adminisztrátor (Admin)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">E-mail cím</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                            placeholder="sofor@ceg.hu"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Ideiglenes jelszó</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                            placeholder="Minimum 6 karakter"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center transition disabled:opacity-50 shadow-lg shadow-indigo-100"
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        {loading ? 'Létrehozás...' : 'Regisztráció véglegesítése'}
                    </button>
                </form>
            </div>
        </div>
    )
}
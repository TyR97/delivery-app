'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from '../lib/supabase'// Ellenőrizd, hogy a lib/supabase.ts elérhető-e!
import {
    PackageCheck,
    LogOut,
    UserCog,
    BarChart3,
    ClipboardList,
    User,
    ShieldCheck
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const [session, setSession] = useState<any>(null);
    const [profile, setProfile] = useState<{ role: string; full_name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Aktuális munkamenet ellenőrzése indításkor
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
                if (pathname !== '/login') router.push('/login');
            }
        };

        getInitialSession();

        // 2. Feliratkozás az Auth változásokra (be/kijelentkezés)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
                if (pathname !== '/login') router.push('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router]);

    // Profil adatok lekérése a 'profiles' táblából
    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', userId)
                .single();

            if (error) {
                console.error("Hiba a profil lekérésekor:", error.message);
            } else {
                console.log("Bejelentkezett profil:", data); // DEBUG infó a konzolban
                setProfile(data);
            }
        } catch (err) {
            console.error("Váratlan hiba:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    // Login oldalon nincs navigáció
    if (pathname === '/login') {
        return (
            <html lang="hu">
            <body className={`${inter.className} bg-slate-900 text-white antialiased`}>
            {children}
            </body>
            </html>
        );
    }

    return (
        <html lang="hu">
        <body className={`${inter.className} bg-slate-900 text-slate-200 antialiased min-h-screen`}>
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* Bal oldal: Logo és Fő menü */}
                    <div className="flex space-x-8 items-center">
                        <Link href="/" className="flex items-center space-x-2 text-indigo-600">
                            <PackageCheck className="w-8 h-8" />
                            <span className="font-extrabold text-xl tracking-tight hidden sm:block text-slate-900">
                    Kézbesítő<span className="text-indigo-600">App</span>
                  </span>
                        </Link>

                        <div className="hidden md:flex space-x-1 ml-6">
                            <Link href="/" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'}`}>
                                <ClipboardList className="w-4 h-4 mr-1.5" />
                                Napi Fuvarok
                            </Link>
                            <Link href="/statisztika" className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${pathname === '/statisztika' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'}`}>
                                <BarChart3 className="w-4 h-4 mr-1.5" />
                                Statisztika
                            </Link>

                            {/* ADMIN EXKLUZÍV GOMB */}
                            {profile?.role === 'admin' && (
                                <Link
                                    href="/admin/users"
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-bold transition border-l ml-2 pl-4 border-slate-200 ${pathname.startsWith('/admin') ? 'text-indigo-700 bg-indigo-100' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                    <UserCog className="w-4 h-4 mr-1.5" />
                                    Felhasználók Kezelése
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Jobb oldal: Felhasználói profil és Logout */}
                    <div className="flex items-center space-x-4">
                        {!loading && session ? (
                            <div className="flex items-center space-x-3 border-l pl-4 border-slate-100">
                                <div className="text-right hidden lg:block">
                                    <p className="text-xs font-bold text-slate-900 leading-none">
                                        {profile?.full_name || 'Felhasználó'}
                                    </p>
                                    <div className="flex items-center justify-end mt-1">
                                        {profile?.role === 'admin' && <ShieldCheck className="w-3 h-3 text-indigo-500 mr-1" />}
                                        <p className={`text-[10px] uppercase tracking-widest font-semibold ${profile?.role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}`}>
                                            {profile?.role || 'Betöltés...'}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold border border-slate-200 shadow-sm">
                                    {profile?.full_name?.charAt(0) || <User className="w-4 h-4 text-slate-400" />}
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="ml-2 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                                    title="Kijelentkezés"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>
        </nav>

        {/* Fő tartalom */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium animate-pulse">Rendszer inicializálása...</p>
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    {children}
                </div>
            )}
        </main>

        {/* Footer / Info sáv (opcionális) */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-xs">
                &copy; 2026 KézbesítőApp Management System • {profile?.role === 'admin' ? 'Adminisztrátori hozzáférés' : 'Korlátozott hozzáférés'}
            </p>
        </footer>
        </body>
        </html>
    );
}
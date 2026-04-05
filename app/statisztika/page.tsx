'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import {
    BarChart3,
    Users,
    Calendar,
    Loader2,
    TrendingUp
} from 'lucide-react'

// Típusok definiálása a TypeScript hibák elkerülésére
interface Driver {
    id: string;
    name: string;
}

interface Day {
    id: string;
    driver_id: string;
    driver?: Driver;
}

export default function StatisticsPage() {
    const [days, setDays] = useState<Day[]>([])
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            const { data: driverData } = await supabase.from('driver').select('id, name')
            if (driverData) setDrivers(driverData)

            const { data: dayData } = await supabase.from('day').select('*, driver(id, name)')
            if (dayData) setDays(dayData as Day[])

        } catch (error) {
            console.error('Hiba az adatok lekérésekor:', error)
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const chartData = drivers.map(driver => {
        const workCount = days.filter(d => d.driver_id === driver.id).length
        return {
            name: driver.name,
            napok: workCount
        }
    }).filter(item => item.napok > 0)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-slate-400 font-medium">Statisztikák elemzése...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-indigo-400" />
                        Statisztika & Elemzés
                    </h1>
                    <p className="text-slate-400 mt-2">Sofőr teljesítmény és munkaidő összesítés.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <Users className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Aktív sofőrök</p>
                        <p className="text-2xl font-black text-white">{chartData.length} fő</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <Calendar className="text-emerald-400 w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Összes rögzített nap</p>
                        <p className="text-2xl font-black text-white">{days.length} nap</p>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex items-center space-x-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                        <TrendingUp className="text-amber-400 w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Legaktívabb sofőr</p>
                        <p className="text-2xl font-black text-white">
                            {chartData.length > 0 ? chartData.sort((a, b) => b.napok - a.napok)[0].name.split(' ')[0] : '-'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800">Dolgozott napok száma</h3>
                    <p className="text-slate-500 text-sm">Sofőrönkénti összesítés az összes rögzített adat alapján.</p>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#94a3b8', fontSize: 12}}
                            />
                            <Tooltip
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                            />
                            <Bar dataKey="napok" radius={[8, 8, 0, 0]} barSize={50} name="Ledolgozott napok">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
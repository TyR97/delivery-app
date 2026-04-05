'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  Trash2,
  Loader2,
  RefreshCcw,
  PlusCircle,
  X
} from 'lucide-react'
import React from 'react'

// --- Típusok ---
interface Driver { id: string; name: string; }
interface Address {
  id: string;
  day_id: string;
  delivery_type: string;
  package_number: number;
  pickup_number: number;
}
interface Day {
  id: string;
  date: string;
  start_km: number;
  end_km: number;
  avg_fuel_consumption: number;
  driver_id: string;
  driver?: Driver;
  address?: Address[];
}

export default function Dashboard() {
  const [days, setDays] = useState<Day[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedDriver, setSelectedDriver] = useState('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newDayData, setNewDayData] = useState({
    date: new Date().toISOString().split('T')[0],
    driver_id: '',
    start_km: 0,
    end_km: 0
  })

  const [newAddress, setNewAddress] = useState({
    delivery_type: 'háznál kézbesítés a címzettnek',
    package_number: 0,
    pickup_number: 0
  })

  const router = useRouter()

  const fetchMetadata = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setIsAdmin(profile?.role === 'admin')
    } else {
      router.push('/login')
    }
    const { data: driverData } = await supabase.from('driver').select('id, name').order('name')
    if (driverData) {
      setDrivers(driverData)
      if (driverData.length > 0) setNewDayData(prev => ({ ...prev, driver_id: driverData[0].id }))
    }
  }, [router])

  const fetchDays = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    setIsSyncing(true)
    try {
      let query = supabase.from('day').select(`*, driver(id, name), address(*)`).order('date', { ascending: false })

      if (selectedMonth !== 'all') {
        const [year, month] = selectedMonth.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate();
        query = query.gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
            .lte('date', `${year}-${String(month).padStart(2, '0')}-${lastDay}`)
      }
      if (selectedDriver !== 'all') query = query.eq('driver_id', selectedDriver)

      const { data, error } = await query
      if (!error) setDays(data as Day[] || [])
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [selectedMonth, selectedDriver])

  useEffect(() => {
    const init = async () => {
      await fetchMetadata()
      await fetchDays()
    }
    init()
  }, [fetchMetadata, fetchDays])

  const handleCreateDay = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSyncing(true)
    const { data, error } = await supabase.from('day').insert([newDayData]).select()
    if (!error) {
      setIsModalOpen(false)
      await fetchDays(true)
      if (data && data[0]) setExpandedDayId(data[0].id)
    }
    setIsSyncing(false)
  }

  const handleLocalUpdate = (dayId: string, field: string, value: any) => {
    setDays(prevDays => prevDays.map(day => day.id === dayId ? { ...day, [field]: value } : day));
  }

  const syncToDatabase = async (id: string, field: string, value: any) => {
    await supabase.from('day').update({ [field]: value }).eq('id', id)
    fetchDays(true)
  }

  const addNewAddress = async (dayId: string) => {
    if (newAddress.package_number === 0 && newAddress.pickup_number === 0) return;
    const tempAddress = { ...newAddress };
    setNewAddress({ delivery_type: 'háznál kézbesítés a címzettnek', package_number: 0, pickup_number: 0 });
    await supabase.from('address').insert([{ day_id: dayId, ...tempAddress }])
    await fetchDays(true);
  }

  const deleteAddress = async (id: string) => {
    if (!confirm("Biztosan törlöd?")) return
    setDays(prevDays => prevDays.map(day => ({
      ...day,
      address: day.address?.filter(a => a.id !== id)
    })));
    await supabase.from('address').delete().eq('id', id)
    await fetchDays(true);
  }

  const calculateFee = (packageSum: number) => {
    if (!packageSum || packageSum < 50) return 0;
    if (packageSum <= 100) return packageSum * 500;
    if (packageSum <= 130) return packageSum * 520;
    if (packageSum <= 180) return packageSum * 540;
    return packageSum * 560;
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' }) })
    }
    return options
  }

  const inputStyles = "bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 block w-full p-2.5 outline-none shadow-sm transition-all";

  return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Napi Fuvarlevelek</h1>
              <div className="flex items-center mt-1">
                <p className="text-sm text-slate-400">{isAdmin ? "Admin szerkesztő mód" : "Megtekintő mód"}</p>
                {isSyncing && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin ml-2" />}
              </div>
            </div>
            <button onClick={() => fetchDays(false)} className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all">
              <RefreshCcw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {isAdmin && (
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl flex items-center font-bold shadow-lg transition-all active:scale-95 mr-2">
                  <PlusCircle className="w-5 h-5 mr-2" /> Új nap rögzítése
                </button>
            )}
            <div className="flex items-center bg-slate-800/50 p-1.5 rounded-xl border border-slate-700 min-w-[180px]">
              <Calendar className="w-4 h-4 text-indigo-400 ml-3" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent text-white text-sm outline-none w-full p-2 cursor-pointer">
                <option value="all" className="bg-slate-900">Összes hónap</option>
                {generateMonthOptions().map(opt => <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center bg-slate-800/50 p-1.5 rounded-xl border border-slate-700 min-w-[180px]">
              <User className="w-4 h-4 text-indigo-400 ml-3" />
              <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="bg-transparent text-white text-sm outline-none w-full p-2 cursor-pointer">
                <option value="all" className="bg-slate-900">Összes sofőr</option>
                {drivers.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
                  <p className="text-slate-500 font-medium">Betöltés...</p>
                </div>
            ) : (
                <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-900">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-black tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-5 text-left">Dátum</th>
                    <th className="px-6 py-5 text-left">Sofőr</th>
                    <th className="px-6 py-5 text-left">Kezdő / Bef. KM</th>
                    <th className="px-6 py-5 text-right">Számított Napi díj</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {days.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400">Nincs adat.</td></tr>
                  ) : days.map((day) => {
                    const realtimePackageSum = day.address?.reduce((sum, addr) => sum + (addr.package_number || 0), 0) || 0;
                    const currentFee = calculateFee(realtimePackageSum);

                    return (
                        <React.Fragment key={day.id}>
                          <tr className={`transition-all duration-200 ${expandedDayId === day.id ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-4">
                                <button onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)} className={`p-1.5 rounded-lg transition-transform ${expandedDayId === day.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                  {expandedDayId === day.id ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                </button>
                                {isAdmin ? (
                                    <input type="date" value={day.date} onChange={e => handleLocalUpdate(day.id, 'date', e.target.value)} onBlur={e => syncToDatabase(day.id, 'date', e.target.value)} className={`${inputStyles} max-w-[160px]`} />
                                ) : <span className="font-bold text-slate-700">{new Date(day.date).toLocaleDateString('hu-HU')}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {isAdmin ? (
                                  <select value={day.driver_id} onChange={e => { handleLocalUpdate(day.id, 'driver_id', e.target.value); syncToDatabase(day.id, 'driver_id', e.target.value); }} className={`${inputStyles} max-w-[200px]`}>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                  </select>
                              ) : <span className="font-medium">{day.driver?.name}</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {isAdmin ? (
                                    <>
                                      <input type="number" value={day.start_km} onChange={e => handleLocalUpdate(day.id, 'start_km', e.target.value)} onBlur={e => syncToDatabase(day.id, 'start_km', parseInt(e.target.value))} className={`${inputStyles} w-28 text-center`} />
                                      <span className="text-slate-300 font-bold">/</span>
                                      <input type="number" value={day.end_km} onChange={e => handleLocalUpdate(day.id, 'end_km', e.target.value)} onBlur={e => syncToDatabase(day.id, 'end_km', parseInt(e.target.value))} className={`${inputStyles} w-28 text-center`} />
                                    </>
                                ) : <span className="font-mono text-slate-500">{day.start_km.toLocaleString()} - {day.end_km.toLocaleString()} km</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-black text-indigo-600">{currentFee.toLocaleString()} Ft</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{realtimePackageSum} CSOMAG</span>
                              </div>
                            </td>
                          </tr>

                          {expandedDayId === day.id && (
                              <tr>
                                <td colSpan={4} className="p-0 bg-slate-50/50 border-y border-slate-100">
                                  <div className="p-8 space-y-6">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center"><MapPin className="w-4 h-4 mr-2 text-indigo-600" /> Címek részletezése</h4>
                                      <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-full uppercase">Kiszállítva: {realtimePackageSum} db</span>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                      <table className="min-w-full text-sm">
                                        <thead className="bg-slate-100 text-slate-500 font-bold">
                                        <tr>
                                          <th className="px-6 py-3 text-left">Állapot</th>
                                          <th className="px-6 py-3 text-right">Csomag (db)</th>
                                          <th className="px-6 py-3 text-right">Pickup (db)</th>
                                          {isAdmin && <th className="px-6 py-3 text-center">Művelet</th>}
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                        {isAdmin && (
                                            <tr className="bg-indigo-50/30">
                                              <td className="px-6 py-3">
                                                <select value={newAddress.delivery_type} onChange={e => setNewAddress({...newAddress, delivery_type: e.target.value})} className={inputStyles}>
                                                  <option value="háznál kézbesítés a címzettnek">háznál kézbesítés a címzettnek</option>
                                                  <option value="ügyfél kérésére letétbe helyezés">ügyfél kérésére letétbe helyezés</option>
                                                  <option value="rossz címzés">rossz címzés</option>
                                                  <option value="címzett általi visszautasítás">címzett általi visszautasítás</option>
                                                  <option value="sikertelen">sikertelen</option>
                                                </select>
                                              </td>
                                              <td className="px-6 py-3"><input type="number" value={newAddress.package_number} onChange={e => setNewAddress({...newAddress, package_number: parseInt(e.target.value) || 0})} className={`${inputStyles} text-right`} /></td>
                                              <td className="px-6 py-3"><input type="number" value={newAddress.pickup_number} onChange={e => setNewAddress({...newAddress, pickup_number: parseInt(e.target.value) || 0})} className={`${inputStyles} text-right`} /></td>
                                              <td className="px-6 py-3 text-center"><button onClick={() => addNewAddress(day.id)} className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg active:scale-90 transition-all"><Plus className="w-5 h-5"/></button></td>
                                            </tr>
                                        )}
                                        {day.address?.map((addr) => {
                                          // JAVÍTOTT LOGIKA: Csak a "sikertelen" piros, minden más zöld
                                          const isStrictlyFailed = addr.delivery_type === "sikertelen";
                                          return (
                                              <tr key={addr.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-3">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${isStrictlyFailed ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                              {addr.delivery_type}
                                            </span>
                                                </td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700">{addr.package_number} <span className="text-slate-400 font-normal ml-1">db</span></td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700">{addr.pickup_number} <span className="text-slate-400 font-normal ml-1">db</span></td>
                                                {isAdmin && <td className="px-6 py-3 text-center"><button onClick={() => deleteAddress(addr.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-5 h-5"/></button></td>}
                                              </tr>
                                          )
                                        })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                          )}
                        </React.Fragment>
                    );
                  })}
                  </tbody>
                </table>
            )}
          </div>
        </div>

        {/* MODAL - ÚJ NAP LÉTREHOZÁSA */}
        {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center"><PlusCircle className="w-6 h-6 mr-2" /> Új fuvarlevél</h2>
                  <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleCreateDay} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Dátum</label>
                    <input type="date" required value={newDayData.date} onChange={e => setNewDayData({...newDayData, date: e.target.value})} className={inputStyles} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sofőr</label>
                    <select required value={newDayData.driver_id} onChange={e => setNewDayData({...newDayData, driver_id: e.target.value})} className={inputStyles}>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Kezdő kilométer</label>
                    <input type="number" required value={newDayData.start_km} onChange={e => setNewDayData({...newDayData, start_km: parseInt(e.target.value) || 0})} className={inputStyles} placeholder="pl. 120500" />
                  </div>
                  <button type="submit" disabled={isSyncing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50">
                    {isSyncing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />} Fuvarlevél rögzítése
                  </button>
                </form>
              </div>
            </div>
        )}
      </div>
  )
}
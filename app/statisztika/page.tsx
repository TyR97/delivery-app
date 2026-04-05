'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Statistics() {
    const [chartData, setChartData] = useState<any[]>([])
    const [trucks, setTrucks] = useState<any[]>([])
    const [selectedTruck, setSelectedTruck] = useState<string>('all')

    useEffect(() => {
        fetchData()
    }, [selectedTruck])

    async function fetchData() {
        const { data: truckData } = await supabase.from('truck').select('id, license_plate_number')
        if (truckData) setTrucks(truckData)

        let query = supabase.from('day').select('date, avg_fuel_consumption, truck(license_plate_number, fuel_consumption)').order('date')

        if (selectedTruck !== 'all') {
            query = query.eq('truck_id', selectedTruck)
        }

        const { data, error } = await query

        if (error) {
            console.error(error)
        } else if (data) {
            const formattedData = data.map(item => {
                return {
                    date: new Date(item.date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
                    'Rendszám': item.truck?.license_plate_number,
                    'Mért fogyasztás (l/100km)': item.avg_fuel_consumption,
                    'Gyári/Várt fogyasztás (l/100km)': item.truck?.fuel_consumption
                }
            })
            setChartData(formattedData)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Fogyasztási Statisztikák</h1>

    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm flex items-center gap-4">
    <label className="font-medium">Szűrés Teherautóra:</label>
    <select
    className="border border-gray-300 rounded p-2"
    value={selectedTruck}
    onChange={(e) => setSelectedTruck(e.target.value)}
>
    <option value="all">Összes teherautó</option>
    {trucks.map(truck => (
        <option key={truck.id} value={truck.id}>{truck.license_plate_number}</option>
    ))}
    </select>
    </div>

    <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '500px' }}>
    <ResponsiveContainer width="100%" height="100%">
    <BarChart
        data={chartData}
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis label={{ value: 'Liter / 100km', angle: -90, position: 'insideLeft' }} />
    <Tooltip />
    <Legend />
    <Bar dataKey="Mért fogyasztás (l/100km)" fill="#f97316" radius={[4, 4, 0, 0]} />
    <Bar dataKey="Gyári/Várt fogyasztás (l/100km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    </BarChart>
    </ResponsiveContainer>
    </div>
    </div>
)
}
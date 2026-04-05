'use server'

import { createClient } from '@supabase/supabase-js'

export async function createNewUser(formData: FormData) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service Role kulcs kell!
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as string

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name: fullName, role: role },
        email_confirm: true // Azonnal aktiváljuk
    })

    if (error) return { error: error.message }
    return { success: true }
}
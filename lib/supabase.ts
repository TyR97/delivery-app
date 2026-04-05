import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qhlcysiuoobphgwaehvs.supabase.co"
const supabaseAnonKey = "sb_publishable_hseoQ14HDQIqKVkPfoheHQ_Hd1nBVBC"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
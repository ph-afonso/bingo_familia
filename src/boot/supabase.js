// src/boot/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqayhcnycnkjyxgptgzt.supabase.co'
const supabaseKey = 'sb_publishable_38htws0gcbmnECNrui8Riw_iSfaS-Fj'

export const supabase = createClient(supabaseUrl, supabaseKey)
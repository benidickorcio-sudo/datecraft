import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mipvnisyxxvcbiizjwgz.supabase.co';
const supabaseAnonKey = 'sb_publishable_5eVk26y4II9fB1Jfy2rsGw_TNvmZ6_L';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
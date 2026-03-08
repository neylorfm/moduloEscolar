import { createClient } from "@supabase/supabase-js";

// Make sure to use the NEXT_PUBLIC_ variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This creates a single instance for the browser
export const supabase = createClient(supabaseUrl, supabaseKey);

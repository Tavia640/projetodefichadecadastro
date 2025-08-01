// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://msxhwlwxpvrtmyngwwcp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zeGh3bHd4cHZydG15bmd3d2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzU1NTAsImV4cCI6MjA2ODg1MTU1MH0.Nrx7hM9gkQ-jn8gmAhZUYntDuCuuUuHHah_8Gnh6uFQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://yyauajxukztsjlmmzhav.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YXVhanh1a3p0c2psbW16aGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTEzOTksImV4cCI6MjEwMzMyNzM5OX0.poyqi9ZNtW5-kT29L45kkrcPWBYEQvLdU71Rip_zKJA'

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log("✅ Connexion Supabase initialisée !");


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noczwifnspociazpxtfh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3p3aWZuc3BvY2lhenB4dGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTEzNTcsImV4cCI6MjA4NDI2NzM1N30.qD_cUtuliBgauYL5SUhzLNHXm6dK8FNVHAODquMjPC8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

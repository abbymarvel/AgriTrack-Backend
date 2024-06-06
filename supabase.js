import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nizrxmwedqowosxndwho.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5penJ4bXdlZHFvd29zeG5kd2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYzODA1MDksImV4cCI6MjAzMTk1NjUwOX0.fH8CRNUWKU3jbl-cdqgLA4GJ7ctOBNfI8-3j3LfkNrU';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
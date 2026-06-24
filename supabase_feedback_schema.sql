-- Execute this SQL in your Supabase SQL Editor to create the feedback table

CREATE TABLE IF NOT EXISTS public.client_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  version_active text NOT NULL, -- 'V1' or 'V2'
  current_step text NOT NULL,
  vehicle_profile jsonb,
  active_results jsonb,
  notes text NOT NULL,
  reviewer_name text
);

-- Enable Row Level Security (optional, but good practice)
ALTER TABLE public.client_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since the client review overlay will post data from the browser)
CREATE POLICY "Allow anonymous inserts to client_feedback"
ON public.client_feedback FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated (or service role) reads
CREATE POLICY "Allow service role reads"
ON public.client_feedback FOR SELECT
TO service_role
USING (true);

-- Create branding storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to branding bucket
CREATE POLICY "Branding images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

-- Allow anyone to upload to branding bucket (admin-gated in UI via passkey)
CREATE POLICY "Anyone can upload branding images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding');

-- Allow anyone to update branding images
CREATE POLICY "Anyone can update branding images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding');

-- Allow anyone to delete branding images
CREATE POLICY "Anyone can delete branding images"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding');

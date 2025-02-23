-- Create storage bucket for session files
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-files', 'session-files', false);

-- Enable RLS for the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for session files bucket
CREATE POLICY "Users can upload session files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session-files' AND
    (storage.objects.name LIKE auth.uid() || '/%' OR
     EXISTS (
       SELECT 1 FROM study_sessions ss
       WHERE storage.objects.name LIKE ss.id || '/%'
       AND ss.user_id = auth.uid()
     ))
  );

CREATE POLICY "Users can view their own session files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'session-files' AND
    EXISTS (
      SELECT 1 FROM session_files sf
      JOIN study_sessions ss ON sf.session_id = ss.id
      WHERE storage.objects.name = sf.file_path
      AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own session files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session-files' AND
    EXISTS (
      SELECT 1 FROM session_files sf
      JOIN study_sessions ss ON sf.session_id = ss.id
      WHERE storage.objects.name = sf.file_path
      AND ss.user_id = auth.uid()
    )
  ); 
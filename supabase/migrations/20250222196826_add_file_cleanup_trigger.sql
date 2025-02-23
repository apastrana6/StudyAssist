-- Function to clean up files from storage when a session is deleted
CREATE OR REPLACE FUNCTION clean_up_session_files()
RETURNS TRIGGER AS $$
DECLARE
  file_paths text[];
BEGIN
  -- Get all file paths for the deleted session
  SELECT ARRAY_AGG(file_path)
  INTO file_paths
  FROM session_files
  WHERE session_id = OLD.id;

  -- If there are files, delete them from storage
  IF array_length(file_paths, 1) > 0 THEN
    -- Note: We can't directly call storage.delete() from a trigger
    -- Instead, we'll insert into a cleanup queue table that will be processed by a separate process
    INSERT INTO storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
    SELECT 
      gen_random_uuid(),
      'session-files',
      unnest(file_paths),
      auth.uid(),
      now(),
      now(),
      now(),
      jsonb_build_object('status', 'pending_deletion')
    ON CONFLICT (bucket_id, name) DO NOTHING;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up files when a session is deleted
DROP TRIGGER IF EXISTS trigger_clean_up_session_files ON study_sessions;
CREATE TRIGGER trigger_clean_up_session_files
  BEFORE DELETE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION clean_up_session_files(); 
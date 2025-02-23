/*
  # Study Session Schema

  1. New Tables
    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `description` (text, required)
      - `study_level` (text)
      - `learning_goals` (text)
      - `learning_style` (text)
      - `weaknesses` (text)
      - `additional_info` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `session_files`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references study_sessions)
      - `file_name` (text)
      - `file_path` (text)
      - `file_type` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations based on user authentication
    - Users can only access their own sessions and files
*/

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  description text NOT NULL,
  study_level text,
  learning_goals text,
  learning_style text,
  weaknesses text,
  additional_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_files table
CREATE TABLE IF NOT EXISTS session_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES study_sessions ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_files ENABLE ROW LEVEL SECURITY;

-- Policies for study_sessions
CREATE POLICY "Users can create their own sessions"
  ON study_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON study_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON study_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON study_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for session_files
CREATE POLICY "Users can view files from their sessions"
  ON session_files
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE id = session_files.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files for their sessions"
  ON session_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE id = session_files.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files from their sessions"
  ON session_files
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM study_sessions
      WHERE id = session_files.session_id
      AND user_id = auth.uid()
    )
  );
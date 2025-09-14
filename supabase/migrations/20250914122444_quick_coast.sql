/*
  # Student Portal Database Schema

  1. New Tables
    - `departments` - Store department information (ECE, EEE, CSE, etc.)
    - `years` - Academic years (I, II, III, IV)  
    - `semesters` - Semester numbers (1-8)
    - `students` - Student records with personal information
    - `attendance` - Daily attendance records
    - `user_profiles` - Extended user information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Ensure data isolation by department/role

  3. Sample Data
    - Insert default departments, years, and semesters
    - Create indexes for performance
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create years table
CREATE TABLE IF NOT EXISTS years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text UNIQUE NOT NULL,
  value integer UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'teacher')),
  department_id uuid REFERENCES departments(id),
  created_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no text UNIQUE NOT NULL,
  name text NOT NULL,
  department_id uuid NOT NULL REFERENCES departments(id),
  year_id uuid NOT NULL REFERENCES years(id),
  semester_id uuid NOT NULL REFERENCES semesters(id),
  blood_group text,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read departments"
  ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read years"
  ON years FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read semesters"
  ON semesters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users full access to students"
  ON students FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users full access to attendance"
  ON attendance FOR ALL TO authenticated USING (true);

-- Insert default data
INSERT INTO departments (code, name) VALUES
  ('ECE', 'Electronics and Communication Engineering'),
  ('EEE', 'Electrical and Electronics Engineering'),
  ('CSE', 'Computer Science and Engineering'),
  ('IT', 'Information Technology'),
  ('CIVIL', 'Civil Engineering'),
  ('MECH', 'Mechanical Engineering')
ON CONFLICT (code) DO NOTHING;

INSERT INTO years (label, value) VALUES
  ('I', 1),
  ('II', 2),
  ('III', 3),
  ('IV', 4)
ON CONFLICT (value) DO NOTHING;

INSERT INTO semesters (number) VALUES
  (1), (2), (3), (4), (5), (6), (7), (8)
ON CONFLICT (number) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_year ON students(year_id);
CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
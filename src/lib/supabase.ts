import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not found. Please click "Connect to Supabase" to set up your database.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Department {
  id: string
  code: string
  name: string
}

export interface Year {
  id: string
  label: string
  value: number
}

export interface Semester {
  id: string
  number: number
}

export interface Student {
  id: string
  reg_no: string
  name: string
  department_id: string
  year_id: string
  semester_id: string
  blood_group?: string
  phone?: string
  email?: string
  address?: string
  department?: Department
  year?: Year
  semester?: Semester
}

export interface Attendance {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent'
  student?: Student
}

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher'
  department_id?: string
}
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase, Department, Year, Semester } from '../lib/supabase'
import { ArrowLeft, Save } from 'lucide-react'

interface StudentFormData {
  reg_no: string
  name: string
  department_id: string
  year_id: string
  semester_id: string
  blood_group?: string
  phone?: string
  email?: string
  address?: string
}

export function StudentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StudentFormData>()

  const isEditing = !!id

  useEffect(() => {
    fetchOptions()
    if (isEditing) {
      fetchStudent()
    }
  }, [id])

  const fetchOptions = async () => {
    const [deptResult, yearResult, semResult] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('years').select('*').order('value'),
      supabase.from('semesters').select('*').order('number'),
    ])

    if (deptResult.data) setDepartments(deptResult.data)
    if (yearResult.data) setYears(yearResult.data)
    if (semResult.data) setSemesters(semResult.data)
  }

  const fetchStudent = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', id!)
      .single()

    if (data) {
      Object.keys(data).forEach((key) => {
        setValue(key as keyof StudentFormData, data[key])
      })
    }
  }

  const onSubmit = async (data: StudentFormData) => {
    setLoading(true)
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('students')
          .update(data)
          .eq('id', id!)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students')
          .insert([data])

        if (error) throw error
      }

      navigate(-1)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  {...register('reg_no', { required: 'Registration number is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="e.g., 2021001"
                />
                {errors.reg_no && (
                  <p className="text-red-500 text-sm mt-1">{errors.reg_no.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Enter student's full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  {...register('department_id', { required: 'Department is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.department_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year *
                </label>
                <select
                  {...register('year_id', { required: 'Year is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      Year {year.label}
                    </option>
                  ))}
                </select>
                {errors.year_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.year_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  {...register('semester_id', { required: 'Semester is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((sem) => (
                    <option key={sem.id} value={sem.id}>
                      Semester {sem.number}
                    </option>
                  ))}
                </select>
                {errors.semester_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.semester_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  {...register('blood_group')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter full address"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 inline-flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Add Student')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
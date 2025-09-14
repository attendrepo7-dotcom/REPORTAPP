import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Student, Department, Year, Semester } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Users, Calendar, Download, Settings, LogOut, Search } from 'lucide-react'
import { StudentCard } from './StudentCard'
import { AttendancePanel } from './AttendancePanel'

export function Dashboard() {
  const { dept, year, sem } = useParams()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAttendance, setShowAttendance] = useState(false)
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null)
  const [yearInfo, setYearInfo] = useState<Year | null>(null)
  const [semesterInfo, setSemesterInfo] = useState<Semester | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchCourseInfo()
  }, [dept, year, sem])

  const fetchCourseInfo = async () => {
    const [deptResult, yearResult, semResult] = await Promise.all([
      supabase.from('departments').select('*').eq('code', dept).single(),
      supabase.from('years').select('*').eq('value', parseInt(year!)).single(),
      supabase.from('semesters').select('*').eq('number', parseInt(sem!)).single(),
    ])

    if (deptResult.data) setDepartmentInfo(deptResult.data)
    if (yearResult.data) setYearInfo(yearResult.data)
    if (semResult.data) setSemesterInfo(semResult.data)
  }

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select(`
        *,
        department:departments(*),
        year:years(*),
        semester:semesters(*)
      `)
      .eq('department.code', dept)
      .eq('year.value', parseInt(year!))
      .eq('semester.number', parseInt(sem!))

    if (data) {
      setStudents(data)
    }
    setLoading(false)
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.reg_no.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {departmentInfo?.code} - Year {year} - Sem {sem}
              </h1>
              <p className="text-sm text-slate-600">{departmentInfo?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/select')}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Change Course
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">--%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => navigate('/students/add')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Student
          </button>
          <button
            onClick={() => setShowAttendance(!showAttendance)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center font-semibold"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Mark Attendance
          </button>
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center font-semibold">
            <Download className="h-5 w-5 mr-2" />
            Export Reports
          </button>
        </div>

        {/* Attendance Panel */}
        {showAttendance && (
          <div className="mb-8">
            <AttendancePanel 
              students={students} 
              onClose={() => setShowAttendance(false)}
              departmentId={departmentInfo?.id}
              yearId={yearInfo?.id}
              semesterId={semesterInfo?.id}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search students by name or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No students match your search.' : 'Get started by adding your first student.'}
            </p>
            <button
              onClick={() => navigate('/students/add')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Student
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
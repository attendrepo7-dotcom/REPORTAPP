import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Department, Year, Semester } from '../lib/supabase'
import { useSelection } from '../hooks/useSelection'
import { ChevronRight, Building2, Calendar, BookOpen } from 'lucide-react'

export function SelectionPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSem, setSelectedSem] = useState('')
  const { setSelection } = useSelection()
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [deptResult, yearResult, semResult] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('years').select('*').order('value'),
      supabase.from('semesters').select('*').order('number'),
    ])

    if (deptResult.data) setDepartments(deptResult.data)
    if (yearResult.data) setYears(yearResult.data)
    if (semResult.data) setSemesters(semResult.data)
  }

  const handleProceed = () => {
    if (selectedDept && selectedYear && selectedSem) {
      const dept = departments.find(d => d.id === selectedDept)
      const year = years.find(y => y.id === selectedYear)
      const sem = semesters.find(s => s.id === selectedSem)
      setSelection(
        selectedDept,
        selectedYear,
        selectedSem,
        dept?.code || '',
        year?.value?.toString() || '',
        sem?.number?.toString() || ''
      )
      navigate(`/dashboard/${dept?.code}/${year?.value}/${sem?.number}`)
    }
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-2 sm:p-4">
  <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 pt-6 sm:pt-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">Select Your Course</h1>
          <p className="text-slate-300 text-base sm:text-lg">Choose department, year, and semester to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
          {/* Department Selection (Dropdown) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center mb-4">
              <Building2 className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Department</h3>
            </div>
            <select
              className="p-2 sm:p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 text-sm sm:text-base"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              title="Select Department"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.code}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selection (Dropdown) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Year</h3>
            </div>
            <select
              className="p-2 sm:p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 text-sm sm:text-base"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              title="Select Year"
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year.id} value={year.id}>
                  Year {year.label}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Selection (Dropdown) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center mb-4">
              <BookOpen className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Semester</h3>
            </div>
            <select
              className="p-2 sm:p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 text-sm sm:text-base"
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
              title="Select Semester"
            >
              <option value="">Select Semester</option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>
                  Semester {sem.number}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleProceed}
            disabled={!selectedDept || !selectedYear || !selectedSem}
            className="bg-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-base sm:text-lg inline-flex items-center"
          >
            Proceed to Dashboard
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useState } from 'react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-white mb-4">Select Your Course</h1>
          <p className="text-slate-300 text-lg">Choose department, year, and semester to continue</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Department Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <Building2 className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Department</h3>
            </div>
            <div className="space-y-2">
              {departments.map((dept) => (
                <label key={dept.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="department"
                    value={dept.id}
                    checked={selectedDept === dept.id}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-slate-800">{dept.code}</div>
                    <div className="text-sm text-slate-600">{dept.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Year Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Year</h3>
            </div>
            <div className="space-y-2">
              {years.map((year) => (
                <label key={year.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="year"
                    value={year.id}
                    checked={selectedYear === year.id}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="font-medium text-slate-800">Year {year.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Semester Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <BookOpen className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-semibold text-slate-800">Semester</h3>
            </div>
            <div className="space-y-2">
              {semesters.map((sem) => (
                <label key={sem.id} className="flex items-center p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="semester"
                    value={sem.id}
                    checked={selectedSem === sem.id}
                    onChange={(e) => setSelectedSem(e.target.value)}
                    className="mr-3 text-orange-500 focus:ring-orange-500"
                  />
                  <div className="font-medium text-slate-800">Semester {sem.number}</div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleProceed}
            disabled={!selectedDept || !selectedYear || !selectedSem}
            className="bg-orange-500 text-white px-8 py-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg inline-flex items-center"
          >
            Proceed to Dashboard
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
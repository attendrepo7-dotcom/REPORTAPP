import React, { useState } from 'react'
import { Student, supabase } from '../lib/supabase'
import { Calendar, Check, X, Download, Users } from 'lucide-react'
import { format } from 'date-fns'
import { exportToExcel, exportToPDF, formatAttendanceForExport } from '../utils/exports'

interface AttendancePanelProps {
  students: Student[]
  onClose: () => void
  departmentId?: string
  yearId?: string
  semesterId?: string
  onAttendanceSaved?: () => void
}

export function AttendancePanel({ students, onClose, departmentId, yearId, semesterId, onAttendanceSaved }: AttendancePanelProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({})
  const [loading, setLoading] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | ''>('')

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleBulkMark = () => {
    if (!bulkStatus) return
    
    const bulkAttendance: Record<string, 'present' | 'absent'> = {}
    students.forEach(student => {
      bulkAttendance[student.id] = bulkStatus
    })
    setAttendance(bulkAttendance)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        date: selectedDate,
        status
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,date'
        })

      if (error) throw error

      alert('Attendance saved successfully!')
      if (onAttendanceSaved) onAttendanceSaved()
      else onClose()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportAttendance = async (format: 'excel' | 'pdf') => {
    try {
      const { data } = await supabase
        .from('attendance')
        .select(`
          *,
          student:students(
            name,
            reg_no,
            department:departments(name)
          )
        `)
        .eq('date', selectedDate)

      if (data && data.length > 0) {
        const formattedData = formatAttendanceForExport(data, students)
        
        if (format === 'excel') {
          exportToExcel(formattedData, `attendance-${selectedDate}`)
        } else {
          // For PDF, we'd need to create a temporary table
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = `
            <h2>Attendance Report - ${selectedDate}</h2>
            <table border="1" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Registration No</th>
                  <th>Status</th>
                  <th>Department</th>
                </tr>
              </thead>
              <tbody>
                ${formattedData.map(record => `
                  <tr>
                    <td>${record['Student Name']}</td>
                    <td>${record['Registration No']}</td>
                    <td>${record['Status']}</td>
                    <td>${record['Department']}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `
          tempDiv.id = 'attendance-table'
          document.body.appendChild(tempDiv)
          await exportToPDF('attendance-table', `attendance-${selectedDate}`)
          document.body.removeChild(tempDiv)
        }
      } else {
        alert('No attendance data found for the selected date.')
      }
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Mark Attendance
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bulk Mark
          </label>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as 'present' | 'absent' | '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">Select Status</option>
            <option value="present">All Present</option>
            <option value="absent">All Absent</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleBulkMark}
            disabled={!bulkStatus}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Apply to All
          </button>
        </div>
      </div>

  <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto mb-6">
        {students.map((student) => (
          <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-600">Reg: {student.reg_no}</p>
            </div>
            <div className="flex flex-row space-x-2 mt-2 sm:mt-0">
              <button
                onClick={() => handleAttendanceChange(student.id, 'present')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  attendance[student.id] === 'present'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
                }`}
              >
                <Check className="h-4 w-4 mr-1" />
                Present
              </button>
              <button
                onClick={() => handleAttendanceChange(student.id, 'absent')}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                  attendance[student.id] === 'absent'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-red-600 border border-red-600 hover:bg-red-50'
                }`}
              >
                <X className="h-4 w-4 mr-1" />
                Absent
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
        <div className="flex flex-row space-x-2 mb-2 sm:mb-0">
          <button
            onClick={() => handleExportAttendance('excel')}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExportAttendance('pdf')}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>

  <div className="flex flex-row space-x-2 sm:space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || Object.keys(attendance).length === 0}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  )
}
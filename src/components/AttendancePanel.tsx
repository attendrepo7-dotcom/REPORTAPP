import React, { useState } from 'react'
import { Student, supabase } from '../lib/supabase'
import { Calendar, Check, X, Users } from 'lucide-react'
import { format } from 'date-fns'


interface AttendancePanelProps {
  students: Student[];
  onClose: () => void;
  onAttendanceSaved?: () => void;
}

export function AttendancePanel({ students, onClose, onAttendanceSaved }: AttendancePanelProps) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({})
  const [loading, setLoading] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | ''>('')
  const [isEditing, setIsEditing] = useState(false)
  const [summary, setSummary] = useState({ present: 0, absent: 0, rate: 0 })
  // Load summary from localStorage on mount and when selectedDate changes
  React.useEffect(() => {
    const key = `attendance-summary-${selectedDate}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setSummary(JSON.parse(stored));
      } catch {
        // Optionally log error or handle it
      }
    } else {
      setSummary({ present: 0, absent: 0, rate: 0 });
    }
  }, [selectedDate]);

  // Load summary from localStorage on mount and when selectedDate changes
  React.useEffect(() => {
    const key = `attendance-summary-${selectedDate}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setSummary(JSON.parse(stored));
      } catch {
        // Optionally log error or handle it
      }
    }
  }, [selectedDate]);

  // Fetch attendance for selected date
  React.useEffect(() => {
    if (students.length === 0) return;
    async function fetchAttendance() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('student_id, status')
          .eq('date', selectedDate)
        if (error) throw error
        if (data && data.length > 0) {
          const att: Record<string, 'present' | 'absent'> = {}
          data.forEach((row: { student_id: string; status: 'present' | 'absent' }) => {
            att[row.student_id] = row.status
          })
          setAttendance(att)
          setIsEditing(true)
        } else {
          setAttendance({})
          setIsEditing(false)
        }
      } catch {
        setAttendance({})
        setIsEditing(false)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [selectedDate, students])
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

      // Save summary to localStorage ONLY on save
      const present = Object.values(attendance).filter((v) => v === 'present').length;
      const absent = Object.values(attendance).filter((v) => v === 'absent').length;
      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const summaryObj = { present, absent, rate };
      localStorage.setItem(`attendance-summary-${selectedDate}`, JSON.stringify(summaryObj));
      setSummary(summaryObj);

      alert('Attendance saved successfully!')
      if (onAttendanceSaved) onAttendanceSaved()
      else onClose()
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('An error occurred while saving attendance.')
      }
    } finally {
      setLoading(false)
    }
  }



  return (
  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
    {/* Attendance Summary */}
    <div className="flex flex-row gap-4 mb-4">
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold">
        Present Today: {summary.present}
      </div>
      <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
        Absent Today: {summary.absent}
      </div>
      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
        Attendance Rate: {summary.rate}%
      </div>
    </div>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Mark Attendance
        </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Close"
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
            title="Select date"
            placeholder="YYYY-MM-DD"
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
            title="Bulk mark status"
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
                disabled={isEditing && !attendance[student.id]}
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
                disabled={isEditing && !attendance[student.id]}
              >
                <X className="h-4 w-4 mr-1" />
                Absent
              </button>
              {isEditing && attendance[student.id] && (
                <button
                  onClick={() => {
                    const updated = { ...attendance };
                    delete updated[student.id];
                    setAttendance(updated);
                  }}
                  className="px-2 py-2 rounded-lg bg-yellow-500 text-white ml-2"
                  title="Edit attendance"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
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
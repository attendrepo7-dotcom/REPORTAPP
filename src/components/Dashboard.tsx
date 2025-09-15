import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Student, Department } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Users, Calendar, Download, Settings, LogOut, Search, FileText, FileDown } from 'lucide-react'
import { exportToExcel, exportToPDF } from '../utils/exports'
import { StudentCard } from './StudentCard'
import { AttendancePanel } from './AttendancePanel'

export function Dashboard() {
  const { dept, year, sem } = useParams()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [studentsError, setStudentsError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  // Track which panel is active: 'attendance', 'export', or null
  const [activePanel, setActivePanel] = useState<null | 'attendance' | 'export'>(null)
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null)

  // Attendance stats state
  // Export state
  const [exportFromDate, setExportFromDate] = useState('')
  const [exportToDate, setExportToDate] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  // Remove showExportPanel, use activePanel instead
  const [presentToday, setPresentToday] = useState<number | null>(null)
  const [absentToday, setAbsentToday] = useState<number | null>(null)
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)

  useEffect(() => {
    fetchStudents()
    fetchCourseInfo()
    loadAttendanceSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Load attendance summary from localStorage for today
  function loadAttendanceSummary() {
    const today = getToday();
    const key = `attendance-summary-${today}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const summary = JSON.parse(stored);
        setPresentToday(summary.present ?? 0);
        setAbsentToday(summary.absent ?? 0);
        setAttendanceRate(summary.rate ?? 0);
      } catch {
        setPresentToday(0);
        setAbsentToday(0);
        setAttendanceRate(0);
      }
    } else {
      setPresentToday(0);
      setAbsentToday(0);
      setAttendanceRate(0);
    }
  }
  // Helper to get today's date in yyyy-MM-dd
  function getToday() {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  }




  const fetchCourseInfo = async () => {

    const deptResult = await supabase.from('departments').select('*').eq('code', dept).single();
    if (deptResult.data) setDepartmentInfo(deptResult.data)

  }

  const fetchStudents = async () => {
    setLoading(true)
    setStudentsError(null)
    try {
      const { data, error } = await supabase
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
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      setStudents([])
      setStudentsError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message?: string }).message || 'Failed to load students.'
          : 'Failed to load students.'
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.reg_no.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Export Attendance Report
  const handleExportAttendance = async (type: 'excel' | 'pdf') => {
    if (!exportFromDate || !exportToDate) {
      alert('Please select both From and To dates.');
      return;
    }
    setExportLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`*, student:students(*, department:departments(*))`)
        .gte('date', exportFromDate)
        .lte('date', exportToDate)
        .in('student_id', students.map(s => s.id));
      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No attendance data found for the selected range.');
        return;
      }
      // Format for export
      const { formatAttendanceForExport } = await import('../utils/exports');
      const formatted = formatAttendanceForExport(data, students);
      if (type === 'excel') {
        exportToExcel(formatted, `attendance_${exportFromDate}_to_${exportToDate}`);
      } else {
        // Create temp table for PDF
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
          <h2>Attendance Report (${exportFromDate} to ${exportToDate})</h2>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Registration No</th>
                <th>Date</th>
                <th>Status</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              ${formatted.map(r => `
                <tr>
                  <td>${r['Student Name']}</td>
                  <td>${r['Registration No']}</td>
                  <td>${r['Date']}</td>
                  <td>${r['Status']}</td>
                  <td>${r['Department']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tempDiv.id = 'attendance-export-table';
        document.body.appendChild(tempDiv);
        await exportToPDF('attendance-export-table', `attendance_${exportFromDate}_to_${exportToDate}`);
        document.body.removeChild(tempDiv);
      }
    } catch (e) {
      alert('Export failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  // Export Student Details
  const handleExportStudents = async (type: 'excel' | 'pdf') => {
    setExportLoading(true);
    try {
      const formatted = students.map(s => ({
        'Name': s.name,
        'Registration No': s.reg_no,
        'Department': s.department?.code || '', // Use abbreviation
        'Year': s.year?.label || '',
        'Semester': s.semester?.number || '',
        'Blood Group': s.blood_group || '',
        'Phone': s.phone || '',
        'Email': s.email || '',
        'Address': s.address || ''
      }));
      if (type === 'excel') {
        exportToExcel(formatted, 'student_details', true); // Pass autofit flag
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
          <h2>Student Details Report</h2>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>Name</th>
                <th>Registration No</th>
                <th>Department</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Blood Group</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              ${formatted.map(r => `
                <tr>
                  <td>${r['Name']}</td>
                  <td>${r['Registration No']}</td>
                  <td>${r['Department']}</td>
                  <td>${r['Year']}</td>
                  <td>${r['Semester']}</td>
                  <td>${r['Blood Group']}</td>
                  <td>${r['Phone']}</td>
                  <td>${r['Email']}</td>
                  <td>${r['Address']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        tempDiv.id = 'student-details-export-table';
        document.body.appendChild(tempDiv);
        await exportToPDF('student-details-export-table', 'student_details');
        document.body.removeChild(tempDiv);
      }
    } catch (e) {
      alert('Export failed: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto sm:h-16 gap-2 py-4 sm:py-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {departmentInfo?.code} - Year {year} - Sem {sem}
              </h1>
              <p className="text-sm text-slate-600">{departmentInfo?.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:space-x-4 w-full sm:w-auto">
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
  <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                <p className="text-2xl font-semibold text-gray-900">{presentToday !== null ? presentToday : '--'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="text-2xl font-semibold text-gray-900">{absentToday !== null ? absentToday : '--'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{attendanceRate !== null ? attendanceRate + '%' : '--%'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 items-stretch sm:items-end">
          <button
            onClick={() => navigate('/students/add')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Student
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'attendance' ? null : 'attendance')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center font-semibold"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Mark Attendance
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'export' ? null : 'export')}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors inline-flex items-center font-semibold"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Reports
          </button>
        </div>

        {/* Export Panel (shown after clicking Export Reports) */}
        {activePanel === 'export' && (
          <div className="flex flex-col gap-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 w-full max-w-xl">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">From</label>
              <input type="date" value={exportFromDate} onChange={e => setExportFromDate(e.target.value)} className="border px-2 py-1 rounded" title="Export from date" placeholder="YYYY-MM-DD" />
              <label className="text-sm font-medium">To</label>
              <input type="date" value={exportToDate} onChange={e => setExportToDate(e.target.value)} className="border px-2 py-1 rounded" title="Export to date" placeholder="YYYY-MM-DD" />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleExportAttendance('excel')} disabled={exportLoading} className="bg-green-500 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50">
                <FileDown className="h-4 w-4 mr-1" /> Attendance Excel
              </button>
              <button onClick={() => handleExportAttendance('pdf')} disabled={exportLoading} className="bg-red-500 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50">
                <FileText className="h-4 w-4 mr-1" /> Attendance PDF
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleExportStudents('excel')} disabled={exportLoading} className="bg-blue-500 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50">
                <FileDown className="h-4 w-4 mr-1" /> Student Excel
              </button>
              <button onClick={() => handleExportStudents('pdf')} disabled={exportLoading} className="bg-purple-500 text-white px-3 py-2 rounded flex items-center text-sm disabled:opacity-50">
                <FileText className="h-4 w-4 mr-1" /> Student PDF
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded border">Close</button>
            </div>
          </div>
        )}

        {/* Attendance Panel */}
        {activePanel === 'attendance' && (
          <div className="mb-8">
            <AttendancePanel 
              students={students} 
              studentsLoading={loading}
              studentsError={studentsError}
              onClose={() => setActivePanel(null)}
              onAttendanceSaved={() => {
                setActivePanel(null)
                loadAttendanceSummary();
              }}
            />
          </div>
        )}

        {/* Search Bar and Students Grid - only show when no panel is active */}
        {activePanel === null && (
          <>
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search students by name or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
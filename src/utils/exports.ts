import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Student, Attendance } from '../lib/supabase'
import { format } from 'date-fns'

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')
  
  const pdf = new jsPDF()
  const imgWidth = 210
  const pageHeight = 295
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight

  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`${filename}.pdf`)
}

export const formatAttendanceForExport = (
  attendance: Attendance[],
  students: Student[]
) => {
  const studentMap = students.reduce((acc, student) => {
    acc[student.id] = student
    return acc
  }, {} as Record<string, Student>)

  return attendance.map(record => ({
    'Student Name': studentMap[record.student_id]?.name || 'N/A',
    'Registration No': studentMap[record.student_id]?.reg_no || 'N/A',
    'Date': format(new Date(record.date), 'dd/MM/yyyy'),
    'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
    'Department': studentMap[record.student_id]?.department?.code || 'N/A'
  }))
}
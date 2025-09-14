import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Student } from '../lib/supabase'
import { Edit, Mail, Phone, MapPin, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface StudentCardProps {
  student: Student
  onUpdate: () => void
}

export function StudentCard({ student, onUpdate }: StudentCardProps) {
  const navigate = useNavigate()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id)

      if (!error) {
        onUpdate()
      }
    }
  }

  return (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 flex flex-col h-full">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs sm:max-w-sm md:max-w-md">{student.name}</h3>
          <p className="text-sm text-gray-600 truncate max-w-xs sm:max-w-sm md:max-w-md">Reg: {student.reg_no}</p>
        </div>
  <div className="flex flex-row space-x-2 mt-2 sm:mt-0">
          <button
            onClick={() => navigate(`/students/${student.id}`)}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

  <div className="space-y-2 mt-2">
        {student.email && (
          <div className="flex items-center text-sm text-gray-600 truncate">
            <Mail className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">{student.email}</span>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center text-sm text-gray-600 truncate">
            <Phone className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">{student.phone}</span>
          </div>
        )}
        {student.address && (
          <div className="flex items-center text-sm text-gray-600 truncate">
            <MapPin className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">{student.address.length > 30 ? `${student.address.substring(0, 30)}...` : student.address}</span>
          </div>
        )}
      </div>

      {student.blood_group && (
        <div className="mt-4 pt-4 border-t">
          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full truncate">
            Blood Group: {student.blood_group}
          </span>
        </div>
      )}
    </div>
  )
}
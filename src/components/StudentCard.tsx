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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-600">Reg: {student.reg_no}</p>
        </div>
        <div className="flex space-x-2">
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

      <div className="space-y-2">
        {student.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2" />
            {student.email}
          </div>
        )}
        {student.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            {student.phone}
          </div>
        )}
        {student.address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {student.address.length > 30 ? `${student.address.substring(0, 30)}...` : student.address}
          </div>
        )}
      </div>

      {student.blood_group && (
        <div className="mt-4 pt-4 border-t">
          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            Blood Group: {student.blood_group}
          </span>
        </div>
      )}
    </div>
  )
}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Users, Search, Trash2, 
  UserPlus, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cedula: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
    } catch (error) {
      toast.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/students`, formData);
      toast.success('Estudiante agregado exitosamente');
      setShowAddModal(false);
      setFormData({ name: '', cedula: '' });
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al agregar estudiante');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/students/${selectedStudent.id}`);
      toast.success('Estudiante eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error('Error al eliminar estudiante');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cedula.includes(searchTerm)
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              <Users className="inline h-8 w-8 mr-3" />
              Gestión de Estudiantes
            </h1>
            <p className="text-gray-600">
              Administra los estudiantes del paralelo
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Estudiante
          </button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-content text-center">
              <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              <p className="text-gray-600 text-sm">Estudiantes Registrados</p>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Lista de Estudiantes</h3>
            <p className="card-description">
              {filteredStudents.length} de {students.length} estudiantes
            </p>
          </div>
          <div className="card-content p-0">
            {filteredStudents.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cédula</th>
                      <th>Fecha de Registro</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="font-medium">{student.name}</td>
                        <td>{student.cedula}</td>
                        <td>
                          {new Date(student.created_at).toLocaleDateString('es-EC')}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer estudiante'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="card-header">
                <h3 className="card-title">Agregar Nuevo Estudiante</h3>
                <p className="card-description">Ingresa los datos del estudiante</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="card-content space-y-4">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">
                      Nombre Completo
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: Juan Pérez García"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cedula" className="form-label">
                      Número de Cédula
                    </label>
                    <input
                      id="cedula"
                      name="cedula"
                      type="text"
                      required
                      className="form-input"
                      placeholder="Ej: 1234567890"
                      value={formData.cedula}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="card-footer flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData({ name: '', cedula: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="card-header">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="card-title text-red-800">Confirmar Eliminación</h3>
                </div>
              </div>
              <div className="card-content">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar al estudiante{' '}
                  <strong>{selectedStudent.name}</strong>?
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Esta acción también eliminará todos los pagos asociados y no se puede deshacer.
                </p>
              </div>
              <div className="card-footer flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedStudent(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-danger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
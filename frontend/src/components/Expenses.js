import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Receipt, Plus, Upload, Search, Trash2, 
  AlertCircle, DollarSign, User, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    responsible_student_id: '',
    description: '',
    amount: '',
    activity_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, studentsRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/students`)
      ]);

      setExpenses(expensesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/upload-image`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({ ...prev, activity_image: response.data.image_url }));
      setImagePreview(response.data.image_url);
      toast.success('Imagen cargada exitosamente');
    } catch (error) {
      toast.error('Error al cargar la imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        responsible_student_id: formData.responsible_student_id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        activity_image: formData.activity_image
      });

      toast.success('Gasto registrado exitosamente');
      setShowExpenseModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrar gasto');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/expenses/${selectedExpense.id}`);
      toast.success('Gasto eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedExpense(null);
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar gasto');
    }
  };

  const resetForm = () => {
    setFormData({
      responsible_student_id: '',
      description: '',
      amount: '',
      activity_image: null
    });
    setImagePreview(null);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'N/A';
  };

  const filteredExpenses = expenses.filter(expense => {
    const studentName = getStudentName(expense.responsible_student_id).toLowerCase();
    const description = expense.description.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return studentName.includes(searchLower) || description.includes(searchLower);
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
              <Receipt className="inline h-8 w-8 mr-3" />
              Gestión de Gastos
            </h1>
            <p className="text-gray-600">
              Registra y administra los gastos del paralelo
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowExpenseModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Gasto
          </button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por responsable o descripción..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-content text-center">
              <p className="text-2xl font-bold text-red-600">
                ${totalExpenses.toFixed(2)}
              </p>
              <p className="text-gray-600 text-sm">Total Gastado</p>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registro de Gastos</h3>
            <p className="card-description">
              {filteredExpenses.length} de {expenses.length} gastos
            </p>
          </div>
          <div className="card-content p-0">
            {filteredExpenses.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Responsable</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                      <th>Comprobante</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="font-medium">
                          {getStudentName(expense.responsible_student_id)}
                        </td>
                        <td className="max-w-xs">
                          <div className="truncate" title={expense.description}>
                            {expense.description}
                          </div>
                        </td>
                        <td className="font-medium text-red-600">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td>
                          {expense.activity_image ? (
                            <button
                              onClick={() => window.open(expense.activity_image, '_blank')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {new Date(expense.created_at).toLocaleDateString('es-EC')}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedExpense(expense);
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
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No se encontraron gastos' : 'No hay gastos registrados'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza registrando el primer gasto'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="card-header">
                <h3 className="card-title">Registrar Nuevo Gasto</h3>
                <p className="card-description">Completa la información del gasto</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="card-content space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="responsible_student_id" className="form-label">
                        <User className="inline h-4 w-4 mr-2" />
                        Estudiante Responsable
                      </label>
                      <select
                        id="responsible_student_id"
                        name="responsible_student_id"
                        className="form-input"
                        value={formData.responsible_student_id}
                        onChange={(e) => setFormData({...formData, responsible_student_id: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar estudiante</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} - {student.cedula}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="amount" className="form-label">
                        <DollarSign className="inline h-4 w-4 mr-2" />
                        Monto del Gasto
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          $
                        </span>
                        <input
                          id="amount"
                          name="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          className="form-input pl-8"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description" className="form-label">
                      <FileText className="inline h-4 w-4 mr-2" />
                      Descripción del Gasto
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      required
                      className="form-input"
                      placeholder="Describe en qué se utilizó el dinero..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="activity_image" className="form-label">
                      <Upload className="inline h-4 w-4 mr-2" />
                      Comprobante o Foto de la Actividad (Opcional)
                    </label>
                    <input
                      id="activity_image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="form-input"
                    />
                    {imagePreview && (
                      <div className="mt-3">
                        <img
                          src={imagePreview}
                          alt="Vista previa del comprobante"
                          className="max-w-xs h-32 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="card-header">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
                  <h3 className="card-title text-red-800">Confirmar Eliminación</h3>
                </div>
              </div>
              <div className="card-content">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar el gasto de{' '}
                  <strong>${selectedExpense.amount.toFixed(2)}</strong>?
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  <strong>Descripción:</strong> {selectedExpense.description}
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="card-footer flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedExpense(null);
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

export default Expenses;
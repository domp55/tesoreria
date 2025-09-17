import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, Upload, Search, Check, X, 
  AlertCircle, DollarSign, Calendar, User, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Payments = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    student_id: '',
    month: '',
    year: '',
    amount: '',
    receipt_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, paymentsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/payments`),
        axios.get(`${API}/payment-settings`)
      ]);

      setStudents(studentsRes.data);
      setPayments(paymentsRes.data);
      setSettings(settingsRes.data);

      // Set default amount from settings
      if (settingsRes.data && !formData.amount) {
        setFormData(prev => ({
          ...prev,
          amount: settingsRes.data.monthly_amount.toString(),
          year: settingsRes.data.academic_year
        }));
      }
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

      setFormData(prev => ({ ...prev, receipt_image: response.data.image_url }));
      setImagePreview(response.data.image_url);
      toast.success('Imagen cargada exitosamente');
    } catch (error) {
      toast.error('Error al cargar la imagen');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/payments`, {
        student_id: formData.student_id,
        month: formData.month,
        year: formData.year,
        amount: parseFloat(formData.amount),
        receipt_image: formData.receipt_image
      });

      toast.success('Pago registrado exitosamente');
      setShowPaymentModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrar pago');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/payments/${selectedPayment.id}`);
      toast.success('Pago eliminado exitosamente');
      setShowDeleteModal(false);
      setSelectedPayment(null);
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar pago');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      month: '',
      year: settings?.academic_year || new Date().getFullYear().toString(),
      amount: settings?.monthly_amount?.toString() || '',
      receipt_image: null
    });
    setImagePreview(null);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'N/A';
  };

  const getPaymentsByStudent = () => {
    const paymentsByStudent = {};
    students.forEach(student => {
      paymentsByStudent[student.id] = {
        student,
        payments: payments.filter(p => p.student_id === student.id)
      };
    });
    return paymentsByStudent;
  };

  const filteredPayments = payments.filter(payment => {
    const studentName = getStudentName(payment.student_id).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase()) ||
           payment.month.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
              <CreditCard className="inline h-8 w-8 mr-3" />
              Gestión de Pagos
            </h1>
            <p className="text-gray-600">
              Registra y administra los aportes mensuales
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowPaymentModal(true);
            }}
            className="btn btn-primary"
            disabled={!settings}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Registrar Pago
          </button>
        </div>

        {/* Configuration Alert */}
        {!settings && (
          <div className="card bg-yellow-50 border-yellow-200 mb-6">
            <div className="card-content">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h4 className="text-yellow-800 font-medium">
                    Configuración Requerida
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Antes de registrar pagos, debes configurar el valor mensual y los meses de pago.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por estudiante o mes..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="card">
            <div className="card-content text-center">
              <p className="text-2xl font-bold text-green-600">{payments.length}</p>
              <p className="text-gray-600 text-sm">Pagos Registrados</p>
            </div>
          </div>
          <div className="card">
            <div className="card-content text-center">
              <p className="text-2xl font-bold text-blue-600">
                ${payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </p>
              <p className="text-gray-600 text-sm">Total Recaudado</p>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Historial de Pagos</h3>
            <p className="card-description">
              {filteredPayments.length} de {payments.length} pagos
            </p>
          </div>
          <div className="card-content p-0">
            {filteredPayments.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Mes</th>
                      <th>Año</th>
                      <th>Monto</th>
                      <th>Comprobante</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="font-medium">
                          {getStudentName(payment.student_id)}
                        </td>
                        <td>{payment.month}</td>
                        <td>{payment.year}</td>
                        <td className="font-medium text-green-600">
                          ${payment.amount.toFixed(2)}
                        </td>
                        <td>
                          {payment.receipt_image ? (
                            <button
                              onClick={() => window.open(payment.receipt_image, '_blank')}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {new Date(payment.created_at).toLocaleDateString('es-EC')}
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
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
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No se encontraron pagos' : 'No hay pagos registrados'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza registrando el primer pago'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="card-header">
                <h3 className="card-title">Registrar Nuevo Pago</h3>
                <p className="card-description">Completa la información del pago</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="card-content space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="student_id" className="form-label">
                        <User className="inline h-4 w-4 mr-2" />
                        Estudiante
                      </label>
                      <select
                        id="student_id"
                        name="student_id"
                        className="form-input"
                        value={formData.student_id}
                        onChange={(e) => setFormData({...formData, student_id: e.target.value})}
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
                        Monto
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="month" className="form-label">
                        <Calendar className="inline h-4 w-4 mr-2" />
                        Mes
                      </label>
                      <select
                        id="month"
                        name="month"
                        className="form-input"
                        value={formData.month}
                        onChange={(e) => setFormData({...formData, month: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar mes</option>
                        {(settings?.selected_months || months).map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="year" className="form-label">
                        Año
                      </label>
                      <input
                        id="year"
                        name="year"
                        type="text"
                        required
                        className="form-input"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="receipt" className="form-label">
                      <Upload className="inline h-4 w-4 mr-2" />
                      Comprobante de Pago (Opcional)
                    </label>
                    <input
                      id="receipt"
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
                      setShowPaymentModal(false);
                      resetForm();
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedPayment && (
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
                  ¿Estás seguro de que deseas eliminar el pago de{' '}
                  <strong>{getStudentName(selectedPayment.student_id)}</strong> 
                  {' '}correspondiente a <strong>{selectedPayment.month} {selectedPayment.year}</strong>?
                </p>
                <p className="text-red-600 text-sm mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="card-footer flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayment(null);
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

export default Payments;
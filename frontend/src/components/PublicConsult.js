import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, User, CreditCard, DollarSign, 
  Calendar, School, TrendingUp, TrendingDown,
  Receipt, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PublicConsult = () => {
  const { cedula: urlCedula } = useParams();
  const [cedula, setCedula] = useState(urlCedula || '');
  const [studentData, setStudentData] = useState(null);
  const [paraleloSummary, setParaleloSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!cedula.trim()) {
      toast.error('Ingresa un número de cédula');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      // Get student data
      const studentResponse = await axios.get(`${API}/public/student/${cedula}`);
      setStudentData(studentResponse.data);

      // Get paralelo summary if student found
      if (studentResponse.data) {
        // We need to get the tesorero_id from the student, but it's not in the public endpoint
        // Let's modify this to get the summary differently
        // For now, we'll skip the paralelo summary in the public view
        setParaleloSummary(null);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setStudentData(null);
        toast.error('No se encontró información para esta cédula');
      } else {
        toast.error('Error al consultar información');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
            <School className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Consulta de Aportes
          </h1>
          <p className="text-gray-600">
            Consulta el estado de los aportes por número de cédula
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <div className="card-content">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="form-group">
                <label htmlFor="cedula" className="form-label">
                  <User className="inline h-4 w-4 mr-2" />
                  Número de Cédula
                </label>
                <div className="flex gap-3">
                  <input
                    id="cedula"
                    type="text"
                    className="form-input"
                    placeholder="Ej: 1234567890"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="spinner mr-2"></div>
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Consultar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Student Information */}
        {searched && !loading && (
          <>
            {studentData ? (
              <div className="space-y-6">
                {/* Student Details */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <User className="inline h-5 w-5 mr-2" />
                      Información del Estudiante
                    </h3>
                  </div>
                  <div className="card-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Nombre Completo</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {studentData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cédula</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {studentData.cedula}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card">
                    <div className="card-content text-center">
                      <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-3">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(studentData.total_paid)}
                      </p>
                      <p className="text-gray-600 text-sm">Total Pagado</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-content text-center">
                      <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-3">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {studentData.payments.length}
                      </p>
                      <p className="text-gray-600 text-sm">Pagos Realizados</p>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-content text-center">
                      <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-3">
                        <Calendar className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {studentData.payments.length > 0 
                          ? new Date(Math.max(...studentData.payments.map(p => new Date(p.created_at)))).toLocaleDateString('es-EC', { month: 'short' })
                          : '-'
                        }
                      </p>
                      <p className="text-gray-600 text-sm">Último Pago</p>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">
                      <Receipt className="inline h-5 w-5 mr-2" />
                      Historial de Pagos
                    </h3>
                    <p className="card-description">
                      Detalle de todos los aportes realizados
                    </p>
                  </div>
                  <div className="card-content p-0">
                    {studentData.payments.length > 0 ? (
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Mes</th>
                              <th>Año</th>
                              <th>Monto</th>
                              <th>Fecha de Pago</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentData.payments
                              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                              .map((payment) => (
                                <tr key={payment.id}>
                                  <td className="font-medium">{payment.month}</td>
                                  <td>{payment.year}</td>
                                  <td className="font-medium text-green-600">
                                    {formatCurrency(payment.amount)}
                                  </td>
                                  <td>
                                    {new Date(payment.created_at).toLocaleDateString('es-EC')}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No hay pagos registrados</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Information Note */}
                <div className="card bg-blue-50 border-blue-200">
                  <div className="card-content">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-medium mb-1">
                          Información Importante
                        </h4>
                        <p className="text-blue-700 text-sm">
                          Esta consulta muestra únicamente los aportes registrados por el tesorero del paralelo. 
                          Si tienes dudas sobre algún pago o necesitas un comprobante, contacta directamente 
                          con el tesorero de tu paralelo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-content text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-full w-fit mx-auto mb-4">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No se encontró información
                  </h3>
                  <p className="text-gray-600 mb-4">
                    No hay registros asociados al número de cédula <strong>{cedula}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Verifica que el número esté correcto o contacta con el tesorero del paralelo
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Sistema de Gestión de Aportes - Consulta Pública
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicConsult;
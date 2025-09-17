import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, DollarSign, Calendar, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    monthly_amount: '',
    selected_months: [],
    academic_year: new Date().getFullYear().toString()
  });

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/payment-settings`);
      if (response.data) {
        setSettings(response.data);
        setFormData({
          monthly_amount: response.data.monthly_amount.toString(),
          selected_months: response.data.selected_months,
          academic_year: response.data.academic_year
        });
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selected_months.length === 0) {
      toast.error('Selecciona al menos un mes');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API}/payment-settings`, {
        monthly_amount: parseFloat(formData.monthly_amount),
        selected_months: formData.selected_months,
        academic_year: formData.academic_year
      });
      
      setSettings(response.data);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleMonthToggle = (month) => {
    setFormData(prev => ({
      ...prev,
      selected_months: prev.selected_months.includes(month)
        ? prev.selected_months.filter(m => m !== month)
        : [...prev.selected_months, month]
    }));
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Settings className="inline h-8 w-8 mr-3" />
            Configuración de Aportes
          </h1>
          <p className="text-gray-600">
            Define el valor mensual y los meses de pago del año lectivo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Settings Summary */}
          {settings && (
            <div className="card bg-green-50 border-green-200">
              <div className="card-header">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="card-title text-green-800">Configuración Actual</h3>
                </div>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Valor Mensual</p>
                    <p className="text-xl font-bold text-green-800">
                      ${settings.monthly_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Año Lectivo</p>
                    <p className="text-xl font-bold text-green-800">
                      {settings.academic_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Meses Configurados</p>
                    <p className="text-xl font-bold text-green-800">
                      {settings.selected_months.length} meses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <DollarSign className="inline h-5 w-5 mr-2" />
                Valor del Aporte Mensual
              </h3>
              <p className="card-description">
                Define el monto que cada estudiante debe pagar mensualmente
              </p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label htmlFor="monthly_amount" className="form-label">
                  Valor en USD
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    id="monthly_amount"
                    name="monthly_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    className="form-input pl-8"
                    placeholder="0.00"
                    value={formData.monthly_amount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Year */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Calendar className="inline h-5 w-5 mr-2" />
                Año Lectivo
              </h3>
              <p className="card-description">
                Selecciona el año lectivo para estos aportes
              </p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label htmlFor="academic_year" className="form-label">
                  Año
                </label>
                <select
                  id="academic_year"
                  name="academic_year"
                  className="form-input"
                  value={formData.academic_year}
                  onChange={handleChange}
                  required
                >
                  <option value={new Date().getFullYear().toString()}>
                    {new Date().getFullYear()}
                  </option>
                  <option value={(new Date().getFullYear() + 1).toString()}>
                    {new Date().getFullYear() + 1}
                  </option>
                  <option value={(new Date().getFullYear() - 1).toString()}>
                    {new Date().getFullYear() - 1}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Month Selection */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Meses de Pago</h3>
              <p className="card-description">
                Selecciona los meses en los que se realizarán los aportes
              </p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {months.map((month) => (
                  <label
                    key={month}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selected_months.includes(month)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.selected_months.includes(month)}
                      onChange={() => handleMonthToggle(month)}
                    />
                    <span className="font-medium text-sm">{month}</span>
                    {formData.selected_months.includes(month) && (
                      <Check className="h-4 w-4 ml-2" />
                    )}
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Meses seleccionados: {formData.selected_months.length}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <div className="spinner mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>

        {/* Summary Card */}
        {formData.monthly_amount && formData.selected_months.length > 0 && (
          <div className="card bg-blue-50 border-blue-200 mt-6">
            <div className="card-content">
              <h4 className="font-semibold text-blue-800 mb-2">Resumen de Configuración</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">
                    <strong>Valor por estudiante por mes:</strong> ${parseFloat(formData.monthly_amount || 0).toFixed(2)}
                  </p>
                  <p className="text-blue-700">
                    <strong>Total por estudiante al año:</strong> ${(parseFloat(formData.monthly_amount || 0) * formData.selected_months.length).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">
                    <strong>Meses de pago:</strong> {formData.selected_months.length}
                  </p>
                  <p className="text-blue-700">
                    <strong>Período:</strong> {formData.academic_year}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
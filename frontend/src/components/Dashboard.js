import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  AlertCircle, Eye, Share2, Copy 
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`);
      setSummary(response.data);
    } catch (error) {
      toast.error('Error al cargar el resumen');
    } finally {
      setLoading(false);
    }
  };

  const generatePublicLink = () => {
    const currentUrl = window.location.origin;
    const publicLink = `${currentUrl}/public`;
    
    navigator.clipboard.writeText(publicLink).then(() => {
      toast.success('¡Link copiado al portapapeles!');
    }).catch(() => {
      toast.error('Error al copiar el link');
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const stats = [
    {
      name: 'Total Ingresos',
      value: formatCurrency(summary?.total_income),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%',
      changeType: 'positive'
    },
    {
      name: 'Total Gastos',
      value: formatCurrency(summary?.total_expenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      change: '-8.2%',
      changeType: 'negative'
    },
    {
      name: 'Saldo Actual',
      value: formatCurrency(summary?.current_balance),
      icon: DollarSign,
      color: summary?.current_balance >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: summary?.current_balance >= 0 ? 'bg-blue-100' : 'bg-red-100',
      change: '0%',
      changeType: 'neutral'
    },
    {
      name: 'Estudiantes',
      value: summary?.total_students || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `${summary?.pending_payments || 0} pendientes`,
      changeType: 'info'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Control
          </h1>
          <p className="text-gray-600">
            Resumen financiero del paralelo
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card hover:shadow-lg transition-all duration-300">
                <div className="card-content">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${
                        stat.changeType === 'positive' ? 'text-green-600' :
                        stat.changeType === 'negative' ? 'text-red-600' :
                        stat.changeType === 'info' ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Acciones Rápidas</h3>
              <p className="card-description">Gestiona tu paralelo</p>
            </div>
            <div className="card-content space-y-3">
              <Link
                to="/students"
                className="btn btn-outline w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Gestionar Estudiantes
              </Link>
              <Link
                to="/payments"
                className="btn btn-outline w-full justify-start"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Registrar Pagos
              </Link>
              <Link
                to="/expenses"
                className="btn btn-outline w-full justify-start"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Gestionar Gastos
              </Link>
            </div>
          </div>

          {/* Configuration */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Configuración</h3>
              <p className="card-description">Ajustes del sistema</p>
            </div>
            <div className="card-content space-y-3">
              <Link
                to="/settings"
                className="btn btn-outline w-full justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Aportes
              </Link>
              <button
                onClick={generatePublicLink}
                className="btn btn-outline w-full justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir Link Público
              </button>
            </div>
          </div>

          {/* Public Access */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Acceso Público</h3>
              <p className="card-description">Para padres de familia</p>
            </div>
            <div className="card-content space-y-3">
              <Link
                to="/public"
                className="btn btn-outline w-full justify-start"
                target="_blank"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Portal Público
              </Link>
              <button
                onClick={generatePublicLink}
                className="btn btn-primary w-full justify-start"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </button>
            </div>
          </div>
        </div>

        {/* Balance Alert */}
        {summary?.current_balance < 0 && (
          <div className="card bg-red-50 border-red-200">
            <div className="card-content">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h4 className="text-red-800 font-medium">
                    Saldo Negativo
                  </h4>
                  <p className="text-red-700 text-sm">
                    El paralelo tiene un saldo negativo de {formatCurrency(Math.abs(summary.current_balance))}. 
                    Considera revisar los gastos o aumentar los aportes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments Alert */}
        {summary?.pending_payments > 0 && (
          <div className="card bg-yellow-50 border-yellow-200 mt-4">
            <div className="card-content">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h4 className="text-yellow-800 font-medium">
                    Pagos Pendientes
                  </h4>
                  <p className="text-yellow-700 text-sm">
                    Hay {summary.pending_payments} pagos pendientes de registrar.
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

export default Dashboard;
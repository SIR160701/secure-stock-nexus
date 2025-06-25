
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Package, 
  Users, 
  Settings, 
  MessageSquare, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEmployees } from '@/hooks/useEmployees';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { ActivityCard } from '@/components/ActivityCard';

const Dashboard = () => {
  const { stockItems } = useStock();
  const { categories } = useStockCategories();
  const { employees } = useEmployees();
  const { maintenanceRecords } = useMaintenance();
  const { activities, isLoading: activitiesLoading } = useActivityHistory();

  // Données pour les graphiques de stock
  const stockByCategory = categories.map(category => ({
    name: category.name,
    total: stockItems.filter(item => item.category === category.name).length,
    available: stockItems.filter(item => item.category === category.name && item.status === 'active').length,
    critical: stockItems.filter(item => {
      const availableCount = stockItems.filter(i => i.category === category.name && i.status === 'active').length;
      return availableCount <= category.critical_threshold;
    }).length > 0 ? 1 : 0
  }));

  // Données pour les graphiques de maintenance
  const maintenanceByStatus = [
    { name: 'Planifiée', value: maintenanceRecords.filter(m => m.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'En cours', value: maintenanceRecords.filter(m => m.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Terminée', value: maintenanceRecords.filter(m => m.status === 'completed').length, color: '#10B981' },
    { name: 'Annulée', value: maintenanceRecords.filter(m => m.status === 'cancelled').length, color: '#EF4444' }
  ];

  // Données pour les graphiques d'employés
  const employeesByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department;
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const departmentData = Object.entries(employeesByDepartment).map(([name, value]) => ({
    name,
    value
  }));

  // Statistiques générales
  const totalCriticalItems = stockItems.filter(item => {
    const category = categories.find(cat => cat.name === item.category);
    const availableCount = stockItems.filter(i => i.category === item.category && i.status === 'active').length;
    return category && availableCount <= category.critical_threshold;
  }).length;

  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const maintenanceInProgress = maintenanceRecords.filter(m => m.status === 'in_progress').length;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
              Tableau de Bord
            </h1>
            <p className="text-purple-100">Vue d'ensemble de votre système de gestion</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stockItems.length}</div>
              <div className="text-sm text-purple-200">Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeEmployees}</div>
              <div className="text-sm text-purple-200">Employés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{maintenanceInProgress}</div>
              <div className="text-sm text-purple-200">Maintenances</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles en Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stockItems.length}</div>
            <p className="text-xs text-blue-600 mt-1">
              {stockItems.filter(item => item.status === 'active').length} disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{totalCriticalItems}</div>
            <p className="text-xs text-red-600 mt-1">
              Réapprovisionnement requis
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{activeEmployees}</div>
            <p className="text-xs text-green-600 mt-1">
              Sur {employees.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenances</CardTitle>
            <Settings className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{maintenanceInProgress}</div>
            <p className="text-xs text-orange-600 mt-1">
              En cours de traitement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock par catégorie */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Répartition du Stock par Catégorie
            </CardTitle>
            <CardDescription>Articles disponibles vs total par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="available" fill="#10B981" name="Disponible" />
                <Bar dataKey="total" fill="#3B82F6" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenances par statut */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Maintenances par Statut
            </CardTitle>
            <CardDescription>Répartition des maintenances</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {maintenanceByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Employés par département */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employés par Département
            </CardTitle>
            <CardDescription>Répartition organisationnelle</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Historique des activités */}
        <ActivityCard activities={activities} isLoading={activitiesLoading} />
      </div>
    </div>
  );
};

export default Dashboard;

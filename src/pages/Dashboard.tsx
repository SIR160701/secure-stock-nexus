
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Package, Settings, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useStock } from '@/hooks/useStock';
import { useMaintenance } from '@/hooks/useMaintenance';

const Dashboard = () => {
  const { employees } = useEmployees();
  const { stockItems } = useStock();
  const { maintenanceRecords } = useMaintenance();

  // Calculate stats
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalDepartments = [...new Set(employees.map(emp => emp.department))].length;
  const lowStockItems = stockItems.filter(item => 
    item.minimum_quantity && item.quantity <= item.minimum_quantity
  ).length;
  const activeMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' || record.status === 'in_progress'
  ).length;

  // Stock by category for chart
  const categoryData = stockItems.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});
  
  const stockChartData = Object.entries(categoryData).map(([category, quantity]) => ({
    name: category,
    value: quantity,
  }));

  // Maintenance status for chart
  const maintenanceStatusData = [
    { name: 'Terminées', value: maintenanceRecords.filter(r => r.status === 'completed').length, color: '#10B981' },
    { name: 'En cours', value: maintenanceRecords.filter(r => r.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Planifiées', value: maintenanceRecords.filter(r => r.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'Annulées', value: maintenanceRecords.filter(r => r.status === 'cancelled').length, color: '#EF4444' },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-300">Aperçu de votre système de gestion</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Articles en stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stockItems.length}</div>
            <p className="text-xs text-slate-500 mt-1">
              {lowStockItems > 0 ? `${lowStockItems} articles critiques` : 'Stock optimal'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-orange-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Maintenances actives</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeMaintenance}</div>
            <p className="text-xs text-slate-500 mt-1">5 en retard</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Employés</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeEmployees}</div>
            <p className="text-xs text-slate-500 mt-1">{totalDepartments} départements</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-pink-600" />
              </div>
              <CardTitle className="text-sm font-medium text-gray-600">Messages Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">127</div>
            <p className="text-xs text-slate-500 mt-1">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Stock par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">État des maintenances</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={maintenanceStatusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maintenanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Activités récentes</CardTitle>
          <CardDescription>Dernières actions effectuées dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Ajout ordinateur portable</p>
                  <p className="text-sm text-slate-500">Par Admin IT</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">2h</Badge>
            </div>
            
            {lowStockItems > 0 && stockItems
              .filter(item => item.minimum_quantity && item.quantity <= item.minimum_quantity)
              .slice(0, 3)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">Stock critique: {item.quantity}/{item.minimum_quantity}</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Critique</Badge>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

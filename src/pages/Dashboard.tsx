
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Package, Settings, MessageSquare, AlertTriangle, CheckCircle, TrendingUp, Calendar, Bell } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useStock } from '@/hooks/useStock';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';

const Dashboard = () => {
  const { employees } = useEmployees();
  const { stockItems } = useStock();
  const { maintenanceRecords } = useMaintenance();
  const { categories } = useStockCategories();
  const { assignments } = useEquipmentAssignments();

  // Calculate enhanced stats
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalDepartments = [...new Set(employees.map(emp => emp.department))].length;
  const lowStockItems = stockItems.filter(item => 
    item.minimum_quantity && item.quantity <= item.minimum_quantity
  ).length;
  const activeMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' || record.status === 'in_progress'
  ).length;
  const pendingMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' && new Date(record.scheduled_date) < new Date()
  ).length;
  const activeAssignments = assignments.filter(a => a.status === 'assigned').length;

  // Enhanced stock data by category
  const categoryData = categories.map(category => {
    const itemsInCategory = stockItems.filter(item => item.category === category.name);
    const totalQuantity = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);
    const criticalItems = itemsInCategory.filter(item => item.quantity <= category.critical_threshold).length;
    
    return {
      name: category.name,
      total: totalQuantity,
      critical: criticalItems,
      threshold: category.critical_threshold,
    };
  });

  // Maintenance status data
  const maintenanceStatusData = [
    { name: 'Terminées', value: maintenanceRecords.filter(r => r.status === 'completed').length, color: '#10B981' },
    { name: 'En cours', value: maintenanceRecords.filter(r => r.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Planifiées', value: maintenanceRecords.filter(r => r.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'Annulées', value: maintenanceRecords.filter(r => r.status === 'cancelled').length, color: '#EF4444' },
  ];

  // Activités récentes combinées
  const recentActivities = [
    // Stock activities
    ...stockItems.slice(0, 2).map(item => ({
      id: `stock-${item.id}`,
      type: 'stock',
      title: `Article ajouté: ${item.name}`,
      description: `Catégorie: ${item.category}`,
      timestamp: new Date(item.created_at),
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      status: item.quantity <= (item.minimum_quantity || 0) ? 'critical' : 'normal'
    })),
    // Employee activities
    ...employees.slice(0, 2).map(emp => ({
      id: `employee-${emp.id}`,
      type: 'employee',
      title: `Employé ajouté: ${emp.first_name} ${emp.last_name}`,
      description: `Département: ${emp.department}`,
      timestamp: new Date(emp.created_at),
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      status: 'normal'
    })),
    // Maintenance activities
    ...maintenanceRecords.slice(0, 2).map(maintenance => ({
      id: `maintenance-${maintenance.id}`,
      type: 'maintenance',
      title: `Maintenance: ${maintenance.equipment_name}`,
      description: `Type: ${maintenance.maintenance_type}`,
      timestamp: new Date(maintenance.created_at),
      icon: Settings,
      color: 'bg-orange-100 text-orange-600',
      status: maintenance.status === 'scheduled' && new Date(maintenance.scheduled_date) < new Date() ? 'critical' : 'normal'
    })),
    // Chat activities
    {
      id: 'chat-1',
      type: 'chat',
      title: 'Assistant IA consulté',
      description: 'Session de chat active',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-600',
      status: 'normal'
    }
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

  // Equipment trends
  const equipmentTrendsData = categories.map(category => ({
    name: category.name,
    assigned: assignments.filter(a => a.status === 'assigned' && stockItems.find(s => s.id === a.equipment_name && s.category === category.name)).length,
    available: stockItems.filter(s => s.category === category.name && s.status === 'active').length,
  }));

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3">Dashboard Analytics</h1>
              <p className="text-blue-100 text-lg">Vue d'ensemble complète de votre système de gestion</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Calendar className="h-8 w-8" />
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Dernière mise à jour</p>
                <p className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Articles en stock</CardTitle>
                <div className="text-3xl font-bold text-slate-900">{stockItems.length}</div>
              </div>
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {lowStockItems > 0 ? `${lowStockItems} articles critiques` : 'Stock optimal'}
              </p>
              {lowStockItems > 0 && <Badge variant="destructive" className="text-xs">{lowStockItems}</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Maintenances</CardTitle>
                <div className="text-3xl font-bold text-slate-900">{activeMaintenance}</div>
              </div>
            </div>
            {pendingMaintenance > 0 && <Bell className="h-5 w-5 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {pendingMaintenance > 0 ? `${pendingMaintenance} en retard` : 'À jour'}
              </p>
              {pendingMaintenance > 0 && <Badge variant="destructive" className="text-xs">{pendingMaintenance}</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Employés actifs</CardTitle>
                <div className="text-3xl font-bold text-slate-900">{activeEmployees}</div>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{totalDepartments} départements</p>
              <Badge variant="secondary" className="text-xs">{activeAssignments} équipements attribués</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Assistant IA</CardTitle>
                <div className="text-3xl font-bold text-slate-900">24/7</div>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">ChatGPT 4.0 connecté</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Analyse du stock par catégorie
            </CardTitle>
            <CardDescription>Distribution et alertes critiques</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Total articles" />
                <Bar dataKey="critical" fill="#EF4444" radius={[8, 8, 0, 0]} name="Articles critiques" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              État des maintenances
            </CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={maintenanceStatusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={8}
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
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {maintenanceStatusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes améliorées */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Activités récentes
          </CardTitle>
          <CardDescription>Notifications en temps réel de tous les modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md ${
                  activity.status === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-500">{activity.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {activity.status === 'critical' && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Critique
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {activity.timestamp.toLocaleDateString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

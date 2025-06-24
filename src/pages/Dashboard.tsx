
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Users, Package, Settings, MessageSquare, AlertTriangle, CheckCircle, TrendingUp, Calendar, Bell, Activity, ChevronRight } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useStock } from '@/hooks/useStock';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { employees } = useEmployees();
  const { stockItems } = useStock();
  const { maintenanceRecords } = useMaintenance();
  const { categories } = useStockCategories();
  const { assignments } = useEquipmentAssignments();

  // Calcul des statistiques avancées
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalDepartments = [...new Set(employees.map(emp => emp.department))].length;
  
  // Stock - articles critiques
  const criticalItems = stockItems.filter(item => {
    const category = categories.find(cat => cat.name === item.category);
    return category && item.quantity <= category.critical_threshold;
  }).length;
  
  // Maintenance - états
  const activeMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' || record.status === 'in_progress'
  ).length;
  const overdueMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' && new Date(record.scheduled_date) < new Date()
  ).length;
  
  const activeAssignments = assignments.filter(a => a.status === 'assigned').length;

  // Données pour les graphiques

  // 1. Répartition du stock par catégorie
  const stockByCategoryData = categories.map(category => {
    const categoryItems = stockItems.filter(item => item.category === category.name);
    const totalQuantity = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const criticalCount = categoryItems.filter(item => item.quantity <= category.critical_threshold).length;
    
    return {
      name: category.name,
      total: totalQuantity,
      articles: categoryItems.length,
      critiques: criticalCount,
      disponible: categoryItems.filter(item => item.status === 'active').length,
      alloue: categoryItems.filter(item => item.status === 'inactive').length,
      maintenance: categoryItems.filter(item => item.status === 'discontinued').length,
    };
  });

  // 2. États de maintenance
  const maintenanceStatusData = [
    { name: 'Planifiées', value: maintenanceRecords.filter(r => r.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'En cours', value: maintenanceRecords.filter(r => r.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Terminées', value: maintenanceRecords.filter(r => r.status === 'completed').length, color: '#10B981' },
    { name: 'Annulées', value: maintenanceRecords.filter(r => r.status === 'cancelled').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // 3. Répartition des employés par département
  const employeesByDepartmentData = [...new Set(employees.map(emp => emp.department))]
    .map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept && emp.status === 'active');
      const deptAssignments = assignments.filter(a => 
        a.status === 'assigned' && 
        deptEmployees.some(emp => emp.id === a.employee_id)
      ).length;
      
      return {
        name: dept,
        employes: deptEmployees.length,
        equipements: deptAssignments
      };
    });

  // 4. Évolution des activités (simulation - 30 derniers jours)
  const activityTrendData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    
    return {
      date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      stock: Math.floor(Math.random() * 10) + 1,
      maintenance: Math.floor(Math.random() * 5) + 1,
      employes: Math.floor(Math.random() * 3) + 1,
      chat: Math.floor(Math.random() * 15) + 5,
    };
  });

  // 5. Activités récentes détaillées
  const recentActivities = [
    // Activités Stock
    ...stockItems.slice(0, 3).map(item => ({
      id: `stock-${item.id}`,
      type: 'stock',
      title: `Article ajouté: ${item.name}`,
      description: `Catégorie: ${item.category} • ${item.park_number ? `N° parc: ${item.park_number}` : 'Nouvel article'}`,
      timestamp: new Date(item.created_at),
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
      status: criticalItems > 0 && categories.find(cat => cat.name === item.category && item.quantity <= cat.critical_threshold) ? 'critical' : 'normal',
      link: '/stock'
    })),
    
    // Activités Employés
    ...employees.slice(0, 2).map(emp => ({
      id: `employee-${emp.id}`,
      type: 'employee',
      title: `Employé ajouté: ${emp.first_name} ${emp.last_name}`,
      description: `Département: ${emp.department} • Poste: ${emp.position}`,
      timestamp: new Date(emp.created_at),
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      status: 'normal',
      link: '/employees'
    })),
    
    // Activités Maintenance
    ...maintenanceRecords.slice(0, 2).map(maintenance => ({
      id: `maintenance-${maintenance.id}`,
      type: 'maintenance',
      title: `Maintenance: ${maintenance.equipment_name}`,
      description: `Type: ${maintenance.maintenance_type} • Priorité: ${maintenance.priority}`,
      timestamp: new Date(maintenance.created_at),
      icon: Settings,
      color: 'bg-orange-100 text-orange-600',
      status: maintenance.status === 'scheduled' && new Date(maintenance.scheduled_date) < new Date() ? 'critical' : 'normal',
      link: '/maintenance'
    })),
    
    // Activité Chat (simulation)
    {
      id: 'chat-activity',
      type: 'chat',
      title: 'Assistant IA consulté',
      description: 'Session de chat avec GPT-4 • Questions sur la gestion',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-600',
      status: 'normal',
      link: '/chat'
    }
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header avec design amélioré */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Dashboard Analytics
              </h1>
              <p className="text-blue-100 text-lg">Vue d'ensemble complète de votre système de gestion</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Activity className="h-8 w-8 mb-2" />
                <p className="text-sm text-blue-100">Système</p>
                <p className="font-semibold">Opérationnel</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Dernière mise à jour</p>
                <p className="font-semibold">{new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/stock">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600">Articles en stock</CardTitle>
                  <div className="text-3xl font-bold text-slate-900">{stockItems.length}</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {criticalItems > 0 ? `${criticalItems} articles critiques` : 'Stock optimal'}
                </p>
                {criticalItems > 0 && <Badge variant="destructive" className="text-xs">{criticalItems}</Badge>}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/maintenance">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600">Maintenances</CardTitle>
                  <div className="text-3xl font-bold text-slate-900">{activeMaintenance}</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-orange-500 group-hover:translate-x-1 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {overdueMaintenance > 0 ? `${overdueMaintenance} en retard` : 'À jour'}
                </p>
                {overdueMaintenance > 0 && <Badge variant="destructive" className="text-xs">{overdueMaintenance}</Badge>}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/employees">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600">Employés actifs</CardTitle>
                  <div className="text-3xl font-bold text-slate-900">{activeEmployees}</div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{totalDepartments} départements</p>
                <Badge variant="secondary" className="text-xs">{activeAssignments} équipements</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/chat">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-pink-50 to-pink-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-gray-600">Assistant IA</CardTitle>
                  <div className="text-3xl font-bold text-slate-900">GPT-4</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <ChevronRight className="h-5 w-5 text-pink-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">ChatGPT connecté et opérationnel</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stock par catégorie */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Répartition du stock par catégorie
            </CardTitle>
            <CardDescription>Articles disponibles, alloués et en maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stockByCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="disponible" fill="#10B981" radius={[0, 0, 0, 0]} name="Disponible" />
                <Bar dataKey="alloue" fill="#3B82F6" radius={[0, 0, 0, 0]} name="Alloué" />
                <Bar dataKey="maintenance" fill="#F59E0B" radius={[0, 0, 0, 0]} name="Maintenance" />
                <Bar dataKey="critiques" fill="#EF4444" radius={[4, 4, 0, 0]} name="Critiques" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* État des maintenances */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              État des maintenances
            </CardTitle>
            <CardDescription>Répartition par statut avec priorités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={maintenanceStatusData}
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
            </div>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
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

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employés par département */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Employés par département
            </CardTitle>
            <CardDescription>Répartition des équipes et équipements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeesByDepartmentData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  width={100}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="employes" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Employés" />
                <Bar dataKey="equipements" fill="#EC4899" radius={[0, 4, 4, 0]} name="Équipements" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution des activités */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Évolution des activités (30j)
            </CardTitle>
            <CardDescription>Suivi des actions par module</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="chat" 
                  stackId="1" 
                  stroke="#EC4899" 
                  fill="#EC4899" 
                  fillOpacity={0.6}
                  name="Chat"
                />
                <Area 
                  type="monotone" 
                  dataKey="stock" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Stock"
                />
                <Area 
                  type="monotone" 
                  dataKey="maintenance" 
                  stackId="1" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.6}
                  name="Maintenance"
                />
                <Area 
                  type="monotone" 
                  dataKey="employes" 
                  stackId="1" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.6}
                  name="Employés"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes améliorées */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Historique des activités récentes
          </CardTitle>
          <CardDescription>Toutes les actions effectuées dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.map((activity) => (
              <Link 
                key={activity.id} 
                to={activity.link}
                className="block"
              >
                <div className={`flex items-center justify-between p-4 rounded-xl transition-all hover:shadow-md cursor-pointer group ${
                  activity.status === 'critical' ? 'bg-red-50 border border-red-200 hover:bg-red-100' : 'bg-slate-50 hover:bg-slate-100'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.color} group-hover:scale-110 transition-transform`}>
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{activity.title}</p>
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
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

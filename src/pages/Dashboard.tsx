
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { 
  Package, 
  Users, 
  Settings, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEmployees } from '@/hooks/useEmployees';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useChatStats } from '@/hooks/useChatStats';
import { ActivityCard } from '@/components/ActivityCard';
import { useEffect } from 'react';

const Dashboard = () => {
  const { stockItems } = useStock();
  const { categories } = useStockCategories();
  const { employees } = useEmployees();
  const { maintenanceRecords } = useMaintenance();
  const { activities, isLoading: activitiesLoading } = useActivityHistory();
  const { chatStats, isLoading: chatStatsLoading } = useChatStats();

  // Données temps réel - le dashboard utilise les mêmes hooks que les autres pages
  // Les données se mettent à jour automatiquement grâce à React Query

  // Données améliorées pour les graphiques de stock
  const stockByCategory = categories.map(category => {
    const categoryItems = stockItems.filter(item => item.category === category.name);
    const available = categoryItems.filter(item => item.status === 'active').length;
    const allocated = categoryItems.filter(item => item.status === 'inactive').length;
    const maintenance = categoryItems.filter(item => item.status === 'discontinued').length;
    
    return {
      name: category.name,
      disponible: available,
      alloué: allocated,
      maintenance: maintenance,
      total: categoryItems.length,
      utilisation: categoryItems.length > 0 ? Math.round(((allocated + maintenance) / categoryItems.length) * 100) : 0
    };
  });

  // Données pour les graphiques de maintenance avec tendance
  const maintenanceByStatus = [
    { name: 'Planifiée', value: maintenanceRecords.filter(m => m.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'En cours', value: maintenanceRecords.filter(m => m.status === 'in_progress').length, color: '#F59E0B' },
    { name: 'Terminée', value: maintenanceRecords.filter(m => m.status === 'completed').length, color: '#10B981' },
    { name: 'Annulée', value: maintenanceRecords.filter(m => m.status === 'cancelled').length, color: '#EF4444' }
  ];

  // Données pour les graphiques d'employés avec équipements
  const employeesByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department;
    if (!acc[dept]) {
      acc[dept] = { total: 0, active: 0 };
    }
    acc[dept].total += 1;
    if (emp.status === 'active') {
      acc[dept].active += 1;
    }
    return acc;
  }, {} as Record<string, { total: number; active: number }>);

  const departmentData = Object.entries(employeesByDepartment).map(([name, data]) => ({
    name,
    total: data.total,
    actifs: data.active
  }));

  // Données de tendance mensuelle
  const monthlyTrend = [
    { mois: 'Jan', stock: 85, maintenance: 12, employés: 45 },
    { mois: 'Fév', stock: 88, maintenance: 15, employés: 48 },
    { mois: 'Mar', stock: 92, maintenance: 18, employés: 52 },
    { mois: 'Avr', stock: 90, maintenance: 14, employés: 55 },
    { mois: 'Mai', stock: 95, maintenance: 16, employés: 58 },
    { mois: 'Juin', stock: stockItems.length, maintenance: maintenanceRecords.length, employés: employees.length }
  ];

  // Statistiques générales améliorées - correction du calcul des alertes critiques
  const criticalCategories = categories.filter(category => {
    const availableCount = stockItems.filter(item => 
      item.category === category.name && item.status === 'active'
    ).length;
    return availableCount <= category.critical_threshold;
  });
  const totalCriticalItems = criticalCategories.length;

  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const maintenanceInProgress = maintenanceRecords.filter(m => m.status === 'in_progress').length;
  const equipmentUtilization = stockItems.length > 0 ? Math.round((stockItems.filter(item => item.status !== 'active').length / stockItems.length) * 100) : 0;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  return (
    <div className="space-y-6">
      {/* Header amélioré */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Activity className="h-8 w-8" />
                </div>
                Tableau de Bord
              </h1>
              <p className="text-xl text-purple-100 mb-4">Vue d'ensemble complète de votre système de gestion</p>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Utilisation équipements: {equipmentUtilization}%
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Clock className="h-3 w-3 mr-1" />
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{stockItems.length}</div>
                <div className="text-sm text-purple-200">Articles total</div>
              </div>
              <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{activeEmployees}</div>
                <div className="text-sm text-purple-200">Employés actifs</div>
              </div>
              <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold">{maintenanceInProgress}</div>
                <div className="text-sm text-purple-200">Maintenances</div>
              </div>
              <div className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-red-300">{totalCriticalItems}</div>
                <div className="text-sm text-red-200">Critiques</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Stock Total</CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">{stockItems.length}</div>
            <p className="text-xs text-blue-700">
              {stockItems.filter(item => item.status === 'active').length} disponibles
            </p>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Utilisation: {equipmentUtilization}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 via-red-100 to-red-200 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Alertes Critiques</CardTitle>
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900 mb-1">{totalCriticalItems}</div>
            <p className="text-xs text-red-700">
              Réapprovisionnement requis
            </p>
            <div className="mt-2 text-xs text-red-600">
              Action immédiate nécessaire
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-green-100 to-green-200 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Équipe Active</CardTitle>
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 mb-1">{activeEmployees}</div>
            <p className="text-xs text-green-700">
              Sur {employees.length} total
            </p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Taux d'activité: {employees.length > 0 ? Math.round((activeEmployees / employees.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Maintenances</CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 mb-1">{maintenanceInProgress}</div>
            <p className="text-xs text-orange-700">
              En cours de traitement
            </p>
            <div className="mt-2 text-xs text-orange-600">
              Total: {maintenanceRecords.length} interventions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques améliorés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques du Chat IA */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              Assistant IA - Statistiques
            </CardTitle>
            <CardDescription>Utilisation de l'assistant Gemini AI</CardDescription>
          </CardHeader>
          <CardContent>
            {chatStatsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-purple-700">Messages total</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {chatStats?.total_messages || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-700">Aujourd'hui</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {chatStats?.messages_today || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-700">Heure la plus active</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {chatStats?.most_active_hour || 'N/A'}
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sujets populaires :</p>
                  <div className="flex flex-wrap gap-2">
                    {chatStats?.popular_topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock par catégorie avec utilisation */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              Répartition et Utilisation du Stock
            </CardTitle>
            <CardDescription>Statut des équipements par catégorie avec taux d'utilisation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stockByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Catégorie: ${label}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="disponible" stackId="a" fill="#10B981" name="Disponible" radius={[0, 0, 0, 0]} />
                <Bar dataKey="alloué" stackId="a" fill="#3B82F6" name="Alloué" radius={[0, 0, 0, 0]} />
                <Bar dataKey="maintenance" stackId="a" fill="#F59E0B" name="Maintenance" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendance mensuelle */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Évolution Mensuelle
            </CardTitle>
            <CardDescription>Tendances des indicateurs clés sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="stock" stackId="1" stroke="#3B82F6" fillOpacity={1} fill="url(#colorStock)" />
                <Area type="monotone" dataKey="maintenance" stackId="2" stroke="#F59E0B" fillOpacity={1} fill="url(#colorMaintenance)" />
                <Line type="monotone" dataKey="employés" stroke="#10B981" strokeWidth={3} dot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenances par statut - Graphique en anneau */}
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              État des Maintenances
            </CardTitle>
            <CardDescription>Répartition détaillée par statut d'intervention</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={maintenanceByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                >
                  {maintenanceByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Historique des activités amélioré */}
        <ActivityCard activities={activities} isLoading={activitiesLoading} />
      </div>

      {/* Employés par département - Graphique horizontal */}
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            Répartition Organisationnelle
          </CardTitle>
          <CardDescription>Distribution des employés par département avec statut d'activité</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={departmentData} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'total' ? 'Total' : 'Actifs']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="actifs" fill="#10B981" name="Actifs" radius={[0, 4, 4, 0]} />
              <Bar dataKey="total" fill="#E5E7EB" name="Total" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

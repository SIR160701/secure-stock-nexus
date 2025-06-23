
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Package, Settings, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useStock } from '@/hooks/useStock';
import { useMaintenance } from '@/hooks/useMaintenance';

const Dashboard = () => {
  const { employees } = useEmployees();
  const { stockItems } = useStock();
  const { maintenanceRecords } = useMaintenance();

  // Calculate stats
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const lowStockItems = stockItems.filter(item => 
    item.minimum_quantity && item.quantity <= item.minimum_quantity
  ).length;
  const pendingMaintenance = maintenanceRecords.filter(record => 
    record.status === 'scheduled' || record.status === 'in_progress'
  ).length;
  const completedMaintenance = maintenanceRecords.filter(record => 
    record.status === 'completed'
  ).length;

  // Department distribution
  const departmentData = employees.reduce((acc: Record<string, number>, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {});
  
  const departmentChartData = Object.entries(departmentData).map(([dept, count]) => ({
    name: dept,
    value: count,
  }));

  // Stock by category
  const categoryData = stockItems.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.quantity;
    return acc;
  }, {});
  
  const stockChartData = Object.entries(categoryData).map(([category, quantity]) => ({
    category,
    quantity,
  }));

  // Maintenance status
  const maintenanceStatusData = [
    { name: 'Planifiée', value: maintenanceRecords.filter(r => r.status === 'scheduled').length },
    { name: 'En cours', value: maintenanceRecords.filter(r => r.status === 'in_progress').length },
    { name: 'Terminée', value: maintenanceRecords.filter(r => r.status === 'completed').length },
    { name: 'Annulée', value: maintenanceRecords.filter(r => r.status === 'cancelled').length },
  ];

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Total: {employees.length} employés
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {lowStockItems > 0 && (
                <>
                  <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                  {lowStockItems} en stock bas
                </>
              )}
              {lowStockItems === 0 && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                  Stock optimal
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance en Cours</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              {completedMaintenance} terminées ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficacité</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maintenanceRecords.length > 0 
                ? Math.round((completedMaintenance / maintenanceRecords.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Taux de maintenance réalisée
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Stock par Catégorie</CardTitle>
            <CardDescription>Répartition des quantités en stock</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Employés par Département</CardTitle>
            <CardDescription>Répartition des effectifs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Articles en Stock Bas</CardTitle>
            <CardDescription>Articles nécessitant un réapprovisionnement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stockItems
                .filter(item => item.minimum_quantity && item.quantity <= item.minimum_quantity)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      {item.quantity}/{item.minimum_quantity}
                    </Badge>
                  </div>
                ))}
              {lowStockItems === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucun article en stock bas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Status Maintenance</CardTitle>
            <CardDescription>Vue d'ensemble des maintenances</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={maintenanceStatusData.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maintenanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {maintenanceStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

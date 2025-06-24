
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Users, Building, UserCheck, Calendar } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import EmployeeDialog from '@/components/EmployeeDialog';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { employees, deleteEmployee } = useEmployees();
  const { assignments } = useEquipmentAssignments();

  // Calculate stats
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const departments = [...new Set(employees.map(emp => emp.department))];
  const totalAssignments = assignments.filter(a => a.status === 'assigned').length;

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Department stats
  const departmentStats = departments.map(dept => {
    const deptEmployees = employees.filter(emp => emp.department === dept && emp.status === 'active');
    const deptAssignments = assignments.filter(a => 
      a.status === 'assigned' && 
      deptEmployees.some(emp => emp.id === a.employee_id)
    ).length;
    
    return {
      name: dept,
      count: deptEmployees.length,
      assignments: deptAssignments
    };
  });

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      await deleteEmployee.mutateAsync(id);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">Terminé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEmployeeAssignments = (employeeId) => {
    return assignments.filter(a => a.employee_id === employeeId && a.status === 'assigned');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Gestion des Employés</h1>
        <p className="text-purple-100">Gérez vos employés et leurs attributions d'équipements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employés actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              sur {employees.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              départements actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipements attribués</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              équipements en cours
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles embauches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => {
                const hireDate = new Date(emp.hire_date);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return hireDate >= thirtyDaysAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Répartition par département</CardTitle>
              <CardDescription>Vue d'ensemble des employés et équipements par département</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedDepartment === 'all' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
              }`}
              onClick={() => setSelectedDepartment('all')}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{activeEmployees}</div>
                <div className="text-sm text-gray-500">Tous départements</div>
                <div className="text-xs text-gray-400 mt-1">{totalAssignments} équipements</div>
              </CardContent>
            </Card>
            
            {departmentStats.map((dept) => (
              <Card 
                key={dept.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDepartment === dept.name ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                }`}
                onClick={() => setSelectedDepartment(dept.name)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{dept.count}</div>
                  <div className="text-sm text-gray-500">{dept.name}</div>
                  <div className="text-xs text-gray-400 mt-1">{dept.assignments} équipements</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employés</CardTitle>
              <CardDescription>Liste complète des employés et leurs attributions</CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedEmployee(null);
              setShowEmployeeDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel employé
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou numéro d'employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>N° Employé</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Équipements attribués</TableHead>
                  <TableHead>Date d'embauche</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const employeeAssignments = getEmployeeAssignments(employee.id);
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.employee_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{employee.department}</Badge>
                      </TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {employeeAssignments.length > 0 ? (
                            employeeAssignments.slice(0, 2).map((assignment, index) => (
                              <div key={assignment.id} className="text-sm">
                                <Badge variant="secondary" className="text-xs">
                                  {assignment.equipment_name}
                                  {assignment.park_number && ` (${assignment.park_number})`}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">Aucun équipement</span>
                          )}
                          {employeeAssignments.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{employeeAssignments.length - 2} autres
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.hire_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(employee.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <EmployeeDialog
        isOpen={showEmployeeDialog}
        onClose={() => setShowEmployeeDialog(false)}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default Employees;

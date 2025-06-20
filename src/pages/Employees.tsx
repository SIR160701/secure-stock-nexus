import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Données de démonstration
const initialEmployees = [
  {
    id: '1',
    name: 'Marie Dupont',
    department: 'Ressources Humaines',
    assignedItems: [
      { parkNumber: 'PC001', model: 'Dell Latitude 5520', assignDate: '2024-01-15' },
      { parkNumber: 'SP001', model: 'iPhone 13', assignDate: '2024-01-20' }
    ]
  },
  {
    id: '2',
    name: 'Jean Martin',
    department: 'IT',
    assignedItems: [
      { parkNumber: 'PC002', model: 'HP EliteBook 840', assignDate: '2024-02-01' }
    ]
  },
  {
    id: '3',
    name: 'Sophie Bernard',
    department: 'Marketing',
    assignedItems: [
      { parkNumber: 'SP002', model: 'Samsung Galaxy S21', assignDate: '2024-02-10' }
    ]
  }
];

const Employees = () => {
  const [employees, setEmployees] = useState(initialEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    department: '',
    equipment: '',
    assignDate: ''
  });
  const [editingEmployee, setEditingEmployee] = useState({
    id: '',
    name: '',
    department: '',
    equipment: '',
    assignDate: ''
  });
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const canModify = hasPermission('admin');

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.department) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et le département",
        variant: "destructive"
      });
      return;
    }

    const employee = {
      id: Date.now().toString(),
      name: newEmployee.name,
      department: newEmployee.department,
      assignedItems: newEmployee.equipment ? [{
        parkNumber: newEmployee.equipment,
        model: 'Équipement assigné',
        assignDate: newEmployee.assignDate || new Date().toISOString().split('T')[0]
      }] : []
    };

    setEmployees([...employees, employee]);
    setNewEmployee({ name: '', department: '', equipment: '', assignDate: '' });
    setIsAddEmployeeOpen(false);
    toast({
      title: "Succès",
      description: "Employé ajouté avec succès"
    });
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee({
      id: employee.id,
      name: employee.name,
      department: employee.department,
      equipment: employee.assignedItems.length > 0 ? employee.assignedItems[0].parkNumber : '',
      assignDate: employee.assignedItems.length > 0 ? employee.assignedItems[0].assignDate : ''
    });
    setIsEditEmployeeOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee.name || !editingEmployee.department) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir au moins le nom et le département",
        variant: "destructive"
      });
      return;
    }

    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id 
        ? {
            ...emp,
            name: editingEmployee.name,
            department: editingEmployee.department,
            assignedItems: editingEmployee.equipment ? [{
              parkNumber: editingEmployee.equipment,
              model: 'Équipement assigné',
              assignDate: editingEmployee.assignDate || new Date().toISOString().split('T')[0]
            }] : []
          }
        : emp
    ));

    setIsEditEmployeeOpen(false);
    toast({
      title: "Succès",
      description: "Employé modifié avec succès"
    });
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
    toast({
      title: "Succès",
      description: "Employé supprimé avec succès"
    });
  };

  const getDepartmentStats = () => {
    const departments = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(departments).map(([dept, count]) => ({ dept, count }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Employés</h1>
            <p className="text-purple-100 mt-2">Gérez les employés et leurs équipements attribués</p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{employees.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getDepartmentStats().length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipements Attribués</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.reduce((total, emp) => total + emp.assignedItems.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-gray-200 focus:border-purple-500 rounded-lg"
          />
        </div>
        
        {canModify && (
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un employé</DialogTitle>
                <DialogDescription>Ajoutez un nouvel employé au système</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeName">Nom de l'employé</Label>
                  <Input 
                    id="employeeName" 
                    placeholder="Ex: Marie Dupont"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Département</Label>
                  <Input 
                    id="department" 
                    placeholder="Ex: Ressources Humaines"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="equipment">Équipement attribué (optionnel)</Label>
                  <Input 
                    id="equipment" 
                    placeholder="Ex: PC001"
                    value={newEmployee.equipment}
                    onChange={(e) => setNewEmployee({...newEmployee, equipment: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="assignDate">Date d'attribution</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      id="assignDate" 
                      type="date" 
                      className="pl-10"
                      value={newEmployee.assignDate}
                      onChange={(e) => setNewEmployee({...newEmployee, assignDate: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Laissez vide pour utiliser la date actuelle
                  </p>
                </div>
                <Button onClick={handleAddEmployee} className="w-full">
                  Ajouter l'employé
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
            <DialogDescription>Modifiez les informations de l'employé</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editEmployeeName">Nom de l'employé</Label>
              <Input 
                id="editEmployeeName" 
                value={editingEmployee.name}
                onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editDepartment">Département</Label>
              <Input 
                id="editDepartment" 
                value={editingEmployee.department}
                onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editEquipment">Équipement attribué</Label>
              <Input 
                id="editEquipment" 
                value={editingEmployee.equipment}
                onChange={(e) => setEditingEmployee({...editingEmployee, equipment: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="editAssignDate">Date d'attribution</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  id="editAssignDate" 
                  type="date" 
                  className="pl-10"
                  value={editingEmployee.assignDate}
                  onChange={(e) => setEditingEmployee({...editingEmployee, assignDate: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={handleUpdateEmployee} className="w-full">
              Modifier l'employé
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Répartition par département */}
      <Card className="shadow-lg border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Répartition par département
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {getDepartmentStats().map(({ dept, count }) => (
              <Badge key={dept} variant="outline" className="px-3 py-1 border-purple-200 text-purple-700">
                {dept}: {count} employé{count > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <div className="grid gap-4">
        {filteredEmployees.map(employee => (
          <Card key={employee.id} className="shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{employee.name.charAt(0)}</span>
                    </div>
                    {employee.name}
                  </CardTitle>
                  <CardDescription className="text-purple-600 font-medium">{employee.department}</CardDescription>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 hover:bg-blue-50 border-blue-300"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50 border-red-300"
                      onClick={() => handleDeleteEmployee(employee.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Équipements attribués:
                </h4>
                {employee.assignedItems.length > 0 ? (
                  <div className="space-y-2">
                    {employee.assignedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium text-gray-800">{item.model}</p>
                          <p className="text-sm text-gray-600">N° Parc: {item.parkNumber}</p>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          Attribué le {new Date(item.assignDate).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Aucun équipement attribué</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Aucun employé trouvé</p>
            <p className="text-muted-foreground">
              {searchTerm ? 'Aucun employé ne correspond à votre recherche.' : 'Commencez par ajouter des employés.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Employees;

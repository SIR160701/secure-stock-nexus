
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';

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
  const { hasPermission } = useAuth();

  const canModify = hasPermission('admin');

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentStats = () => {
    const departments = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(departments).map(([dept, count]) => ({ dept, count }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Employés</h1>
        <p className="text-gray-600 mt-2">Gérez les employés et leurs équipements attribués</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getDepartmentStats().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Équipements Attribués</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
            className="pl-10"
          />
        </div>
        
        {canModify && (
          <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
            <DialogTrigger asChild>
              <Button>
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
                  <Input id="employeeName" placeholder="Ex: Marie Dupont" />
                </div>
                <div>
                  <Label htmlFor="department">Département</Label>
                  <Input id="department" placeholder="Ex: Ressources Humaines" />
                </div>
                <div>
                  <Label htmlFor="equipment">Équipements attribués</Label>
                  <Input id="equipment" placeholder="Ex: PC001, SP001" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Séparez les numéros de parc par des virgules
                  </p>
                </div>
                <Button className="w-full">Ajouter l'employé</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Répartition par département */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par département</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getDepartmentStats().map(({ dept, count }) => (
              <Badge key={dept} variant="outline">
                {dept}: {count} employé{count > 1 ? 's' : ''}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      <div className="grid gap-4">
        {filteredEmployees.map(employee => (
          <Card key={employee.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{employee.name}</CardTitle>
                  <CardDescription>{employee.department}</CardDescription>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2">Équipements attribués:</h4>
                {employee.assignedItems.length > 0 ? (
                  <div className="space-y-2">
                    {employee.assignedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.model}</p>
                          <p className="text-sm text-muted-foreground">N° Parc: {item.parkNumber}</p>
                        </div>
                        <Badge variant="outline">
                          Attribué le {new Date(item.assignDate).toLocaleDateString('fr-FR')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun équipement attribué</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
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

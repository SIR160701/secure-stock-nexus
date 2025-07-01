
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Edit, Trash2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useStock } from '@/hooks/useStock';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { EmployeeSearch } from '@/components/EmployeeSearch';
import EmployeeDialog from '@/components/EmployeeDialog';
import { Button } from '@/components/ui/button';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const { employees, deleteEmployee } = useEmployees();
  const { assignments } = useEquipmentAssignments();
  const { updateStockItem, stockItems } = useStock();
  const { addActivity } = useActivityHistory();

  // Filtrer les employés selon la recherche
  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      emp.first_name.toLowerCase().includes(search) ||
      emp.last_name.toLowerCase().includes(search) ||
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search)
    );
  });

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      // Récupérer les équipements de l'employé
      const employeeAssignments = assignments.filter(a => a.employee_id === id && a.status === 'assigned');
      
      // Remettre les équipements en "disponible" dans le stock
      for (const assignment of employeeAssignments) {
        const stockItem = stockItems.find(item => 
          (item.park_number === assignment.park_number || item.serial_number === assignment.serial_number) &&
          item.name === assignment.equipment_name
        );
        
        if (stockItem && stockItem.status === 'inactive') {
          await updateStockItem.mutateAsync({
            id: stockItem.id,
            status: 'active'
          });
        }
      }
      
      await deleteEmployee.mutateAsync(id);
      
      addActivity.mutate({
        action: 'Suppression',
        description: `Employé supprimé et équipements remis en stock`,
        page: 'Employés'
      });
    }
  };

  const getEmployeeAssignments = (employeeId) => {
    return assignments.filter(a => a.employee_id === employeeId && a.status === 'assigned');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              Gestion des Employés
            </h1>
            <p className="text-purple-100">Gérez vos employés et leurs attributions d'équipements</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{employees.length}</div>
            <div className="text-sm text-purple-200">Employés total</div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-4">
        <EmployeeSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Liste des employés */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Liste des employés</CardTitle>
          <CardDescription>
            Tous les employés avec leurs équipements attribués (gérés depuis la page Stock)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'Aucun employé trouvé' : 'Aucun employé enregistré'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Essayez de modifier votre recherche.'
                  : 'Les employés sont créés automatiquement lors de l\'attribution d\'équipements depuis la page Stock.'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Équipements attribués</TableHead>
                    <TableHead>Date de réception</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => {
                    const employeeAssignments = getEmployeeAssignments(employee.id);
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{employee.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {employeeAssignments.length > 0 ? (
                              employeeAssignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="text-sm">
                                  <Badge variant="secondary" className="text-xs">
                                    {assignment.equipment_name}
                                    {assignment.park_number && ` (${assignment.park_number})`}
                                    {assignment.serial_number && ` - ${assignment.serial_number}`}
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">Aucun équipement</span>
                            )}
                            {employeeAssignments.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{employeeAssignments.length - 3} autres équipements
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {employeeAssignments.length > 0 ? (
                              employeeAssignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="text-sm text-gray-600">
                                  {new Date(assignment.assigned_date).toLocaleDateString('fr-FR')}
                                </div>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </div>
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
          )}
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <EmployeeDialog
        isOpen={showEmployeeDialog}
        onClose={() => {
          setShowEmployeeDialog(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default Employees;

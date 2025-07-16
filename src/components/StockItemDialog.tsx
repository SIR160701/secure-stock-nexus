
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock, StockItem } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEmployees } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';

interface StockItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item?: StockItem | null;
}

const StockItemDialog: React.FC<StockItemDialogProps> = ({ isOpen, onClose, item }) => {
  const [formData, setFormData] = useState({
    name: '',
    park_number: '',
    serial_number: '',
    category: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued',
  });

  // Données pour allocation
  const [allocatedData, setAllocatedData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });

  // Données pour maintenance
  const [maintenanceData, setMaintenanceData] = useState({
    problem: '',
    technician: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    maintenance_status: 'scheduled' as 'scheduled' | 'in_progress',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const { createStockItem, updateStockItem, stockItems } = useStock();
  const { categories } = useStockCategories();
  const { createEmployee, employees, updateEmployee } = useEmployees();
  const { createAssignment, deleteAssignment, assignments } = useEquipmentAssignments();
  const { createMaintenanceRecord } = useMaintenance();
  const { addActivity } = useActivityHistory();
  const { users } = useUsers();

  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        name: item.name || '',
        park_number: item.park_number || '',
        serial_number: item.serial_number || '',
        category: item.category || '',
        status: item.status || 'active',
      });

      // Si l'article est alloué, récupérer les données de l'employé
      if (item.status === 'inactive') {
        const assignment = assignments.find(a => 
          a.equipment_name === item.name && 
          (a.park_number === item.park_number || a.serial_number === item.serial_number) &&
          a.status === 'assigned'
        );
        
        if (assignment) {
          const employee = employees.find(e => e.id === assignment.employee_id);
          if (employee) {
            setAllocatedData({
              first_name: employee.first_name || '',
              last_name: employee.last_name || '',
              department: employee.department || '',
              assigned_date: assignment.assigned_date || new Date().toISOString().split('T')[0],
            });
          }
        }
      } else {
        setAllocatedData({
          first_name: '',
          last_name: '',
          department: '',
          assigned_date: new Date().toISOString().split('T')[0],
        });
      }
    } else if (!isOpen) {
      resetForm();
    }
  }, [item, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      park_number: '',
      serial_number: '',
      category: categories[0]?.name || '',
      status: 'active',
    });
    setAllocatedData({
      first_name: '',
      last_name: '',
      department: '',
      assigned_date: new Date().toISOString().split('T')[0],
    });
    setMaintenanceData({
      problem: '',
      technician: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      maintenance_status: 'scheduled',
      priority: 'medium',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        ...formData,
        sku: `SKU-${Date.now()}`,
        quantity: 1,
        description: `Article: ${formData.name}`,
      };

      let savedItem;
      const previousStatus = item?.status;

      if (item) {
        // Gestion des changements de statut lors de la modification
        if (previousStatus === 'inactive' && formData.status !== 'inactive') {
          // Supprimer l'assignation précédente
          const oldAssignment = assignments.find(a => 
            a.equipment_name === item.name && 
            (a.park_number === item.park_number || a.serial_number === item.serial_number) &&
            a.status === 'assigned'
          );
          if (oldAssignment) {
            await deleteAssignment.mutateAsync(oldAssignment.id);
          }
        }

        savedItem = await updateStockItem.mutateAsync({
          id: item.id,
          ...itemData,
        });
        
        addActivity.mutate({
          action: 'Modification',
          description: `Article "${formData.name}" modifié`,
          page: 'Stock'
        });
      } else {
        savedItem = await createStockItem.mutateAsync(itemData);
        
        addActivity.mutate({
          action: 'Création',
          description: `Nouvel article "${formData.name}" ajouté au stock`,
          page: 'Stock'
        });
      }

      // Gestion de l'allocation
      if (formData.status === 'inactive' && allocatedData.first_name && allocatedData.last_name) {
        // Si c'est une modification et que l'article était déjà alloué, supprimer l'ancienne attribution
        if (item && item.status === 'inactive') {
          const oldAssignment = assignments.find(a => 
            a.equipment_name === item.name && 
            (a.park_number === item.park_number || a.serial_number === item.serial_number) &&
            a.status === 'assigned'
          );
          if (oldAssignment) {
            await deleteAssignment.mutateAsync(oldAssignment.id);
          }
        }

        // Vérifier si l'employé existe déjà avec les nouvelles informations
        const existingEmployee = employees.find(emp => 
          emp.first_name.toLowerCase() === allocatedData.first_name.toLowerCase() &&
          emp.last_name.toLowerCase() === allocatedData.last_name.toLowerCase() &&
          emp.department.toLowerCase() === allocatedData.department.toLowerCase()
        );

        let employeeId;
        if (existingEmployee) {
          employeeId = existingEmployee.id;
        } else {
          // Créer un nouvel employé
          const employeeData = {
            first_name: allocatedData.first_name,
            last_name: allocatedData.last_name,
            department: allocatedData.department,
            email: `${allocatedData.first_name.toLowerCase()}.${allocatedData.last_name.toLowerCase()}@entreprise.com`,
            employee_number: `EMP-${Date.now()}`,
            position: 'Employé',
            hire_date: allocatedData.assigned_date,
            status: 'active' as 'active' | 'inactive' | 'terminated',
            phone: '',
          };

          const newEmployee = await createEmployee.mutateAsync(employeeData);
          employeeId = newEmployee.id;
        }

        // Créer la nouvelle assignation
        await createAssignment.mutateAsync({
          employee_id: employeeId,
          equipment_name: formData.name,
          park_number: formData.park_number || '',
          serial_number: formData.serial_number || '',
          assigned_date: allocatedData.assigned_date,
          status: 'assigned' as 'assigned' | 'returned',
        });

        addActivity.mutate({
          action: 'Attribution',
          description: `Article "${formData.name}" attribué à ${allocatedData.first_name} ${allocatedData.last_name}`,
          page: 'Employés'
        });
      }

      // Gestion de la maintenance
      if (formData.status === 'discontinued' && maintenanceData.problem && maintenanceData.technician) {
        // Sauvegarder le statut précédent de l'article
        const previousStatus = item ? item.status : 'active';
        
        await createMaintenanceRecord.mutateAsync({
          equipment_name: formData.name,
          park_number: formData.park_number || '',
          serial_number: formData.serial_number || '',
          maintenance_type: 'corrective',
          description: maintenanceData.problem,
          scheduled_date: maintenanceData.start_date,
          completed_date: maintenanceData.end_date || undefined,
          technician_id: maintenanceData.technician,
          status: maintenanceData.maintenance_status,
          priority: maintenanceData.priority,
          previous_status: previousStatus,
          notes: `Maintenance créée depuis l'interface stock`,
        });

        // Envoyer un email au technicien
        const selectedUser = users.find(u => u.id === maintenanceData.technician);
        if (selectedUser && selectedUser.email) {
          try {
            await supabase.functions.invoke('send-maintenance-email', {
              body: {
                technicianEmail: selectedUser.email,
                technicianName: selectedUser.full_name || selectedUser.email,
                equipmentName: formData.name,
                parkNumber: formData.park_number || '',
                serialNumber: formData.serial_number || '',
                description: maintenanceData.problem,
                priority: maintenanceData.priority,
                scheduledDate: maintenanceData.start_date
              }
            });
          } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          }
        }

        addActivity.mutate({
          action: 'Maintenance',
          description: `Maintenance créée pour "${formData.name}"`,
          page: 'Maintenance'
        });
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Disponible' },
    { value: 'inactive', label: 'Alloué' },
    { value: 'discontinued', label: 'Maintenance' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
          <DialogDescription>
            {item ? 'Modifier les informations de l\'article.' : 'Ajouter un nouvel article au stock.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Modèle de l'article *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Laptop Dell Latitude 5520"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="park_number">Numéro de parc</Label>
                <Input
                  id="park_number"
                  value={formData.park_number}
                  onChange={(e) => setFormData({ ...formData, park_number: e.target.value })}
                  placeholder="Ex: PC001"
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Numéro de série</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Ex: SN123456"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive' | 'discontinued') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Champs d'allocation si statut = "Alloué" */}
            {formData.status === 'inactive' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Informations d'attribution</h3>
                
                <div>
                  <Label htmlFor="employee_select">Employé *</Label>
                  <Select 
                    value={allocatedData.first_name && allocatedData.last_name ? 
                      employees.find(e => e.first_name === allocatedData.first_name && e.last_name === allocatedData.last_name)?.id || '' : ''} 
                    onValueChange={(value) => {
                      const selectedEmployee = employees.find(e => e.id === value);
                      if (selectedEmployee) {
                        setAllocatedData({ 
                          ...allocatedData, 
                          first_name: selectedEmployee.first_name, 
                          last_name: selectedEmployee.last_name,
                          department: selectedEmployee.department
                        });
                      }
                    }}
                    required={formData.status === 'inactive'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} - {employee.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department">Département *</Label>
                  <Input
                    id="department"
                    value={allocatedData.department}
                    onChange={(e) => setAllocatedData({ ...allocatedData, department: e.target.value })}
                    placeholder="Ex: Informatique, RH, Comptabilité..."
                    required={formData.status === 'inactive'}
                  />
                </div>

                <div>
                  <Label htmlFor="assigned_date">Date d'attribution *</Label>
                  <Input
                    id="assigned_date"
                    type="date"
                    value={allocatedData.assigned_date}
                    onChange={(e) => setAllocatedData({ ...allocatedData, assigned_date: e.target.value })}
                    required={formData.status === 'inactive'}
                  />
                </div>
              </div>
            )}

            {/* Champs de maintenance si statut = "Maintenance" */}
            {formData.status === 'discontinued' && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-semibold">Informations de maintenance</h3>
                
                <div>
                  <Label htmlFor="problem">Description du problème *</Label>
                  <Textarea
                    id="problem"
                    value={maintenanceData.problem}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, problem: e.target.value })}
                    placeholder="Décrivez le problème rencontré..."
                    required={formData.status === 'discontinued'}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="technician">Technicien assigné *</Label>
                  <Select 
                    value={maintenanceData.technician} 
                    onValueChange={(value) => setMaintenanceData({ ...maintenanceData, technician: value })}
                    required={formData.status === 'discontinued'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={maintenanceData.start_date}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, start_date: e.target.value })}
                      required={formData.status === 'discontinued'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin prévue</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={maintenanceData.end_date}
                      onChange={(e) => setMaintenanceData({ ...maintenanceData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="priority">Priorité *</Label>
                  <Select 
                    value={maintenanceData.priority} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setMaintenanceData({ ...maintenanceData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maintenance_status">Statut de la maintenance *</Label>
                  <Select 
                    value={maintenanceData.maintenance_status} 
                    onValueChange={(value: 'scheduled' | 'in_progress') => 
                      setMaintenanceData({ ...maintenanceData, maintenance_status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Planifiée</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Annuler
            </Button>
            <Button type="submit" disabled={createStockItem.isPending || updateStockItem.isPending}>
              {item ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockItemDialog;

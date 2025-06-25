
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useStock } from '@/hooks/useStock';

interface EmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

interface EquipmentAssignmentForm {
  id?: string;
  equipment_name: string;
  park_number: string;
  serial_number: string;
  assigned_date: string;
  isNew?: boolean;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
  });

  const [equipments, setEquipments] = useState<EquipmentAssignmentForm[]>([
    { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
  ]);

  const { createEmployee, updateEmployee } = useEmployees();
  const { createAssignment, updateAssignment, deleteAssignment, assignments } = useEquipmentAssignments();
  const { addActivity } = useActivityHistory();
  const { stockItems } = useStock();

  // Filtrer les articles disponibles pour attribution
  const availableStockItems = stockItems.filter(item => item.status === 'active');

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        department: employee.department || '',
      });

      // Charger les équipements existants de l'employé
      const employeeAssignments = assignments.filter(a => a.employee_id === employee.id && a.status === 'assigned');
      if (employeeAssignments.length > 0) {
        setEquipments(employeeAssignments.map(a => ({
          id: a.id,
          equipment_name: a.equipment_name,
          park_number: a.park_number,
          serial_number: a.serial_number || '',
          assigned_date: a.assigned_date,
          isNew: false
        })));
      } else {
        setEquipments([
          { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
        ]);
      }
    } else {
      resetForm();
    }
  }, [employee, isOpen, assignments]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      department: '',
    });
    setEquipments([
      { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
    ]);
  };

  const addEquipment = () => {
    setEquipments([...equipments, {
      equipment_name: '',
      park_number: '',
      serial_number: '',
      assigned_date: new Date().toISOString().split('T')[0],
      isNew: true
    }]);
  };

  const removeEquipment = async (index: number) => {
    const equipment = equipments[index];
    
    if (equipment.id && !equipment.isNew) {
      // Supprimer de la base de données
      await deleteAssignment.mutateAsync(equipment.id);
    }
    
    if (equipments.length > 1) {
      setEquipments(equipments.filter((_, i) => i !== index));
    } else {
      // Réinitialiser le dernier équipement
      setEquipments([
        { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
      ]);
    }
  };

  const updateEquipment = (index: number, field: keyof EquipmentAssignmentForm, value: string) => {
    const newEquipments = [...equipments];
    newEquipments[index] = { ...newEquipments[index], [field]: value };
    setEquipments(newEquipments);
  };

  const handleEquipmentSelect = (index: number, selectedName: string) => {
    const selectedItem = availableStockItems.find(item => item.name === selectedName);
    if (selectedItem) {
      updateEquipment(index, 'equipment_name', selectedName);
      updateEquipment(index, 'park_number', selectedItem.park_number || '');
      updateEquipment(index, 'serial_number', selectedItem.serial_number || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let employeeId: string;

      // Données pour l'employé
      const employeeData = {
        ...formData,
        email: `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@entreprise.com`,
        employee_number: `EMP-${Date.now()}`,
        position: 'Employé',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active' as 'active' | 'inactive' | 'terminated',
        phone: '',
      };

      if (employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          ...employeeData,
        });
        employeeId = employee.id;
        
        addActivity.mutate({
          action: 'Modification',
          description: `Employé "${formData.first_name} ${formData.last_name}" modifié`,
          page: 'Employés'
        });
      } else {
        const newEmployee = await createEmployee.mutateAsync(employeeData);
        employeeId = newEmployee.id;
        
        addActivity.mutate({
          action: 'Création',
          description: `Nouvel employé "${formData.first_name} ${formData.last_name}" ajouté`,
          page: 'Employés'
        });
      }

      // Gérer les équipements
      for (const equipment of equipments) {
        if (equipment.equipment_name.trim()) {
          const assignmentData = {
            employee_id: employeeId,
            equipment_name: equipment.equipment_name,
            park_number: equipment.park_number || '',
            serial_number: equipment.serial_number || '',
            assigned_date: equipment.assigned_date,
            status: 'assigned' as 'assigned' | 'returned',
          };

          if (equipment.id && !equipment.isNew) {
            // Mettre à jour l'équipement existant
            await updateAssignment.mutateAsync({
              id: equipment.id,
              ...assignmentData,
            });
          } else {
            // Créer un nouvel équipement
            await createAssignment.mutateAsync(assignmentData);
          }
        }
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Modifier l\'employé' : 'Nouvel employé'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Modifier les informations de l\'employé et ses équipements.' : 'Ajouter un nouvel employé avec ses équipements.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Informations de l'employé */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="department">Département *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Ex: Informatique, RH, Comptabilité..."
                required
              />
            </div>

            {/* Section équipements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Équipements attribués</Label>
                <Button type="button" onClick={addEquipment} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un équipement
                </Button>
              </div>
              
              {equipments.map((equipment, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="space-y-3 p-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Équipement {index + 1}
                        {equipment.id && !equipment.isNew && (
                          <span className="text-xs text-gray-500 ml-2">(Existant)</span>
                        )}
                      </span>
                      <Button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label htmlFor={`equipment_name_${index}`}>Modèle de l'équipement</Label>
                      <Select onValueChange={(value) => handleEquipmentSelect(index, value)} value={equipment.equipment_name}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un équipement" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStockItems.map((item) => (
                            <SelectItem key={item.id} value={item.name}>
                              {item.name} {item.park_number && `(${item.park_number})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`park_number_${index}`}>N° de parc</Label>
                        <Input
                          id={`park_number_${index}`}
                          value={equipment.park_number}
                          onChange={(e) => updateEquipment(index, 'park_number', e.target.value)}
                          placeholder="Automatique depuis le stock"
                          readOnly
                        />
                      </div>
                      <div>
                        <Label htmlFor={`serial_number_${index}`}>N° de série</Label>
                        <Input
                          id={`serial_number_${index}`}
                          value={equipment.serial_number}
                          onChange={(e) => updateEquipment(index, 'serial_number', e.target.value)}
                          placeholder="Automatique depuis le stock"
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`assigned_date_${index}`}>Date d'attribution</Label>
                      <Input
                        id={`assigned_date_${index}`}
                        type="date"
                        value={equipment.assigned_date}
                        onChange={(e) => updateEquipment(index, 'assigned_date', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Annuler
            </Button>
            <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
              {employee ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;

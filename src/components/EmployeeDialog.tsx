
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';

interface EmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

interface EquipmentAssignmentForm {
  equipment_name: string;
  park_number: string;
  serial_number: string;
  assigned_date: string;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    email: '',
    employee_number: '',
    position: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active' as const,
  });

  const [equipments, setEquipments] = useState<EquipmentAssignmentForm[]>([
    { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
  ]);

  const { createEmployee, updateEmployee } = useEmployees();
  const { createAssignment, updateAssignment } = useEquipmentAssignments();

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        department: employee.department || '',
        email: employee.email || '',
        employee_number: employee.employee_number || '',
        position: employee.position || '',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        status: employee.status || 'active',
      });
    } else {
      resetForm();
    }
  }, [employee, isOpen]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      department: '',
      email: '',
      employee_number: `EMP-${Date.now()}`,
      position: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
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
      assigned_date: new Date().toISOString().split('T')[0]
    }]);
  };

  const removeEquipment = (index: number) => {
    if (equipments.length > 1) {
      setEquipments(equipments.filter((_, i) => i !== index));
    }
  };

  const updateEquipment = (index: number, field: keyof EquipmentAssignmentForm, value: string) => {
    const newEquipments = [...equipments];
    newEquipments[index] = { ...newEquipments[index], [field]: value };
    setEquipments(newEquipments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let employeeId: string;

      if (employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          ...formData,
        });
        employeeId = employee.id;
      } else {
        const newEmployee = await createEmployee.mutateAsync(formData);
        employeeId = newEmployee.id;
      }

      // Créer les attributions d'équipements
      for (const equipment of equipments) {
        if (equipment.equipment_name.trim()) {
          await createAssignment.mutateAsync({
            employee_id: employeeId,
            equipment_name: equipment.equipment_name,
            park_number: equipment.park_number || undefined,
            serial_number: equipment.serial_number || undefined,
            assigned_date: equipment.assigned_date,
            status: 'assigned',
          });
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
            {employee ? 'Modifier les informations de l\'employé.' : 'Ajouter un nouvel employé.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Équipements attribués</Label>
                <Button type="button" onClick={addEquipment} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              
              {equipments.map((equipment, index) => (
                <Card key={index} className="p-4">
                  <CardContent className="space-y-3 p-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Équipement {index + 1}</span>
                      {equipments.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeEquipment(index)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`equipment_name_${index}`}>Modèle</Label>
                        <Input
                          id={`equipment_name_${index}`}
                          value={equipment.equipment_name}
                          onChange={(e) => updateEquipment(index, 'equipment_name', e.target.value)}
                          placeholder="Ex: Laptop Dell"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`park_number_${index}`}>N° de parc</Label>
                        <Input
                          id={`park_number_${index}`}
                          value={equipment.park_number}
                          onChange={(e) => updateEquipment(index, 'park_number', e.target.value)}
                          placeholder="Ex: PC001"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`serial_number_${index}`}>N° de série</Label>
                        <Input
                          id={`serial_number_${index}`}
                          value={equipment.serial_number}
                          onChange={(e) => updateEquipment(index, 'serial_number', e.target.value)}
                          placeholder="Ex: SN123456"
                        />
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

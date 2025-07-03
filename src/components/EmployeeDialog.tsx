
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useStock } from '@/hooks/useStock';
import { useActivityHistory } from '@/hooks/useActivityHistory';

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

  const { updateEmployee } = useEmployees();
  const { createAssignment, updateAssignment, deleteAssignment, assignments } = useEquipmentAssignments();
  const { stockItems, updateStockItem } = useStock();
  const { addActivity } = useActivityHistory();

  useEffect(() => {
    if (isOpen && employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        department: employee.department || '',
      });

      const employeeAssignments = assignments.filter(a => a.employee_id === employee.id);
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
    } else if (!isOpen) {
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


  const removeEquipment = async (index: number) => {
    const equipment = equipments[index];
    
    if (equipment.id && !equipment.isNew) {
      await deleteAssignment.mutateAsync(equipment.id);
      
      // Remettre l'article en "disponible" dans le stock
      const stockItem = stockItems.find(item => 
        item.name === equipment.equipment_name && 
        (item.park_number === equipment.park_number || item.serial_number === equipment.serial_number)
      );
      
      if (stockItem && stockItem.status === 'inactive') {
        await updateStockItem.mutateAsync({
          id: stockItem.id,
          status: 'active'
        });
      }
    }
    
    if (equipments.length > 1) {
      setEquipments(equipments.filter((_, i) => i !== index));
    } else {
      setEquipments([
        { equipment_name: '', park_number: '', serial_number: '', assigned_date: new Date().toISOString().split('T')[0] }
      ]);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) return;
    
    try {
      const employeeData = {
        ...formData,
        email: `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@entreprise.com`,
        employee_number: employee.employee_number,
        position: employee.position,
        hire_date: employee.hire_date,
        status: employee.status,
        phone: employee.phone || '',
      };

      await updateEmployee.mutateAsync({
        id: employee.id,
        ...employeeData,
      });
      
      addActivity.mutate({
        action: 'Modification',
        description: `Employé "${formData.first_name} ${formData.last_name}" modifié`,
        page: 'Employés'
      });

      // Les équipements ne peuvent plus être modifiés, cette section est supprimée
      
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
          <DialogTitle>Modifier l'employé</DialogTitle>
          <DialogDescription>
            Modifier les informations de l'employé et ses équipements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Équipements attribués</Label>
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
                      <Label>Modèle de l'équipement</Label>
                      <Input
                        value={equipment.equipment_name}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>N° de parc</Label>
                        <Input
                          value={equipment.park_number}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label>N° de série</Label>
                        <Input
                          value={equipment.serial_number}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Date d'attribution</Label>
                      <Input
                        type="date"
                        value={equipment.assigned_date}
                        disabled
                        className="bg-gray-50"
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
            <Button type="submit" disabled={updateEmployee.isPending}>
              Modifier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDialog;

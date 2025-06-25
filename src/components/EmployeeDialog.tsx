
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees, Employee } from '@/hooks/useEmployees';
import { useEquipmentAssignments } from '@/hooks/useEquipmentAssignments';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useStock } from '@/hooks/useStock';

interface EmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

const EmployeeDialog: React.FC<EmployeeDialogProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_number: '',
    email: '',
    department: '',
    position: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    equipment_name: '',
    park_number: '',
    serial_number: '',
  });

  const { createEmployee, updateEmployee } = useEmployees();
  const { createAssignment } = useEquipmentAssignments();
  const { addActivity } = useActivityHistory();
  const { stockItems, updateStockItem } = useStock();

  // Filtrer les articles disponibles
  const availableItems = stockItems.filter(item => item.status === 'active');

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        employee_number: employee.employee_number || '',
        email: employee.email || '',
        department: employee.department || '',
        position: employee.position || '',
        phone: employee.phone || '',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        equipment_name: '',
        park_number: '',
        serial_number: '',
      });
    } else {
      resetForm();
    }
  }, [employee, isOpen]);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      employee_number: '',
      email: '',
      department: '',
      position: '',
      phone: '',
      hire_date: new Date().toISOString().split('T')[0],
      equipment_name: '',
      park_number: '',
      serial_number: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      return;
    }
    
    try {
      const employeeData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        employee_number: formData.employee_number,
        email: formData.email,
        department: formData.department,
        position: formData.position,
        phone: formData.phone,
        hire_date: formData.hire_date,
        status: 'active',
      };

      let savedEmployee;
      if (employee) {
        savedEmployee = await updateEmployee.mutateAsync({
          id: employee.id,
          ...employeeData,
        });
        
        addActivity.mutate({
          action: 'Modification',
          description: `Employé "${formData.first_name} ${formData.last_name}" modifié`,
          page: 'Employés'
        });
      } else {
        savedEmployee = await createEmployee.mutateAsync(employeeData);
        
        addActivity.mutate({
          action: 'Création',
          description: `Nouvel employé "${formData.first_name} ${formData.last_name}" ajouté`,
          page: 'Employés'
        });

        // Si un équipement est sélectionné, créer l'attribution
        if (formData.equipment_name && formData.park_number) {
          const stockItem = stockItems.find(item => 
            item.name === formData.equipment_name && 
            item.park_number === formData.park_number
          );

          if (stockItem) {
            await createAssignment.mutateAsync({
              employee_id: savedEmployee.id,
              equipment_name: formData.equipment_name,
              park_number: formData.park_number,
              serial_number: formData.serial_number || '',
              assigned_date: new Date().toISOString().split('T')[0],
              status: 'assigned',
            });

            // Changer le statut de l'article à "alloué"
            await updateStockItem.mutateAsync({
              id: stockItem.id,
              status: 'inactive',
              assigned_to: savedEmployee.id,
            });

            addActivity.mutate({
              action: 'Attribution',
              description: `Équipement "${formData.equipment_name}" attribué à ${formData.first_name} ${formData.last_name}`,
              page: 'Employés'
            });
          }
        }
      }
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const getUniqueEquipmentNames = () => {
    const names = [...new Set(availableItems.map(item => item.name))];
    return names;
  };

  const getAvailableParkNumbers = (equipmentName: string) => {
    return availableItems
      .filter(item => item.name === equipmentName)
      .map(item => item.park_number)
      .filter(Boolean);
  };

  const getAvailableSerialNumbers = (equipmentName: string, parkNumber: string) => {
    return availableItems
      .filter(item => item.name === equipmentName && item.park_number === parkNumber)
      .map(item => item.serial_number)
      .filter(Boolean);
  };

  const handleEquipmentChange = (equipmentName: string) => {
    setFormData({ ...formData, equipment_name: equipmentName, park_number: '', serial_number: '' });
  };

  const handleParkNumberChange = (parkNumber: string) => {
    setFormData({ ...formData, park_number: parkNumber, serial_number: '' });
    const availableSerials = getAvailableSerialNumbers(formData.equipment_name, parkNumber);
    if (availableSerials.length === 1) {
      setFormData(prev => ({ ...prev, serial_number: availableSerials[0] }));
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employee_number">N° d'employé</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hire_date">Date d'embauche</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
            </div>

            {!employee && (
              <>
                <hr className="my-4" />
                <h3 className="text-lg font-semibold">Attribution d'équipement (optionnel)</h3>
                
                <div>
                  <Label htmlFor="equipment_name">Modèle de l'équipement</Label>
                  <Select value={formData.equipment_name} onValueChange={handleEquipmentChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un équipement" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueEquipmentNames().map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="park_number">N° de parc</Label>
                    <Select 
                      value={formData.park_number} 
                      onValueChange={handleParkNumberChange}
                      disabled={!formData.equipment_name}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un n° de parc" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableParkNumbers(formData.equipment_name).map((parkNumber) => (
                          <SelectItem key={parkNumber} value={parkNumber}>
                            {parkNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="serial_number">N° de série</Label>
                    <Select 
                      value={formData.serial_number} 
                      onValueChange={(value) => setFormData({ ...formData, serial_number: value })}
                      disabled={!formData.equipment_name || !formData.park_number}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un n° de série" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableSerialNumbers(formData.equipment_name, formData.park_number).map((serialNumber) => (
                          <SelectItem key={serialNumber} value={serialNumber}>
                            {serialNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
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

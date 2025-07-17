
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useEmployees } from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { supabase } from '@/integrations/supabase/client';

interface StockItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
}

const StockItemDialog: React.FC<StockItemDialogProps> = ({ isOpen, onClose, item }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    quantity: 1,
    minimum_quantity: 10,
    unit_price: 0,
    supplier: '',
    location: '',
    sku: '',
    park_number: '',
    serial_number: '',
    status: 'active'
  });

  const [allocatedData, setAllocatedData] = useState({
    employee_id: '',
    assigned_date: new Date().toISOString().split('T')[0]
  });

  const [maintenanceData, setMaintenanceData] = useState({
    maintenance_type: '',
    description: '',
    priority: 'medium',
    scheduled_date: new Date().toISOString().split('T')[0],
    technician_id: ''
  });

  const { createStockItem, updateStockItem } = useStock();
  const { categories } = useStockCategories();
  const { employees } = useEmployees();
  const { users } = useUsers();
  const { createMaintenanceRecord } = useMaintenance();
  const { addActivity } = useActivityHistory();

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        quantity: item.quantity || 1,
        minimum_quantity: item.minimum_quantity || 10,
        unit_price: item.unit_price || 0,
        supplier: item.supplier || '',
        location: item.location || '',
        sku: item.sku || '',
        park_number: item.park_number || '',
        serial_number: item.serial_number || '',
        status: item.status || 'active'
      });
      
      if (item.assigned_to) {
        setAllocatedData({
          employee_id: item.assigned_to,
          assigned_date: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        quantity: 1,
        minimum_quantity: 10,
        unit_price: 0,
        supplier: '',
        location: '',
        sku: `SKU-${Date.now()}`,
        park_number: '',
        serial_number: '',
        status: 'active'
      });
      setAllocatedData({
        employee_id: '',
        assigned_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const stockData = {
        ...formData,
        assigned_to: formData.status === 'inactive' ? allocatedData.employee_id : null
      };

      if (item) {
        await updateStockItem.mutateAsync({
          id: item.id,
          ...stockData
        });
        
        addActivity.mutate({
          action: 'Modification',
          description: `Article "${formData.name}" modifié`,
          page: 'Stock'
        });
      } else {
        await createStockItem.mutateAsync(stockData);
        
        addActivity.mutate({
          action: 'Création',
          description: `Article "${formData.name}" ajouté au stock`,
          page: 'Stock'
        });
      }

      // Créer une maintenance si le statut est "maintenance"
      if (formData.status === 'maintenance' && maintenanceData.maintenance_type && maintenanceData.technician_id) {
        await createMaintenanceRecord.mutateAsync({
          equipment_name: formData.name,
          park_number: formData.park_number,
          serial_number: formData.serial_number,
          maintenance_type: maintenanceData.maintenance_type,
          description: maintenanceData.description,
          priority: maintenanceData.priority,
          scheduled_date: maintenanceData.scheduled_date,
          technician_id: maintenanceData.technician_id,
          status: 'scheduled'
        });

        // Envoi d'email au technicien assigné
        const assignedTechnician = users.find(user => user.id === maintenanceData.technician_id);
        if (assignedTechnician?.email) {
          console.log('Envoi d\'email au technicien pour maintenance:', assignedTechnician.email);
          
          try {
            const { error: emailError } = await supabase.functions.invoke('send-maintenance-email', {
              body: {
                technicianEmail: assignedTechnician.email,
                technicianName: assignedTechnician.full_name || 'Technicien',
                equipmentName: formData.name,
                parkNumber: formData.park_number,
                serialNumber: formData.serial_number,
                description: maintenanceData.description,
                priority: maintenanceData.priority,
                scheduledDate: maintenanceData.scheduled_date
              }
            });
            
            if (emailError) {
              console.error('Erreur envoi email:', emailError);
            } else {
              console.log('Email envoyé avec succès');
            }
          } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
          }
        }
        
        addActivity.mutate({
          action: 'Création',
          description: `Maintenance programmée pour "${formData.name}"`,
          page: 'Stock'
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === allocatedData.employee_id);
  const selectedTechnician = users.find(user => user.id === maintenanceData.technician_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Modifier' : 'Ajouter'} un article</DialogTitle>
          <DialogDescription>
            {item ? 'Modifiez les informations de l\'article.' : 'Ajoutez un nouvel article au stock.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'article *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée de l'article..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
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
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Disponible</SelectItem>
                    <SelectItem value="inactive">Alloué</SelectItem>
                    <SelectItem value="maintenance">En maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minimum_quantity">Quantité min</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  min="0"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_quantity: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="unit_price">Prix unitaire</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="park_number">Numéro de parc</Label>
                <Input
                  id="park_number"
                  value={formData.park_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, park_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="serial_number">Numéro de série</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Fournisseur</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            {/* Section pour allocation */}
            {formData.status === 'inactive' && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Informations d'allocation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_id">Employé *</Label>
                    <Select value={allocatedData.employee_id} onValueChange={(value) => setAllocatedData(prev => ({ ...prev, employee_id: value }))}>
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
                    {selectedEmployee && (
                      <p className="text-sm text-gray-600 mt-1">
                        Département: {selectedEmployee.department}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="assigned_date">Date d'allocation</Label>
                    <Input
                      id="assigned_date"
                      type="date"
                      value={allocatedData.assigned_date}
                      onChange={(e) => setAllocatedData(prev => ({ ...prev, assigned_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section pour maintenance */}
            {formData.status === 'maintenance' && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Informations de maintenance</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maintenance_type">Type de maintenance *</Label>
                      <Select value={maintenanceData.maintenance_type} onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, maintenance_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preventive">Préventive</SelectItem>
                          <SelectItem value="corrective">Corrective</SelectItem>
                          <SelectItem value="emergency">Urgence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priorité *</Label>
                      <Select value={maintenanceData.priority} onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="technician_id">Technicien assigné *</Label>
                    <Select value={maintenanceData.technician_id} onValueChange={(value) => setMaintenanceData(prev => ({ ...prev, technician_id: value }))}>
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
                    {selectedTechnician && (
                      <p className="text-sm text-gray-600 mt-1">
                        Email: {selectedTechnician.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduled_date">Date programmée *</Label>
                      <Input
                        id="scheduled_date"
                        type="date"
                        value={maintenanceData.scheduled_date}
                        onChange={(e) => setMaintenanceData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="maintenance_description">Description du problème *</Label>
                    <Textarea
                      id="maintenance_description"
                      value={maintenanceData.description}
                      onChange={(e) => setMaintenanceData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez le problème ou la maintenance à effectuer..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createStockItem.isPending || updateStockItem.isPending}>
              {item ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StockItemDialog;

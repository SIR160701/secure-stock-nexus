
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
import { useActivityHistory } from '@/hooks/useActivityHistory';

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

  const [allocatedData, setAllocatedData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });

  const { createStockItem, updateStockItem } = useStock();
  const { categories } = useStockCategories();
  const { createEmployee } = useEmployees();
  const { addActivity } = useActivityHistory();

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        park_number: item.park_number || '',
        serial_number: item.serial_number || '',
        category: item.category || '',
        status: item.status || 'active',
      });
    } else {
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
      if (item) {
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

      // Si le statut est "Alloué", créer un employé
      if (formData.status === 'inactive' && allocatedData.first_name && allocatedData.last_name) {
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

        await createEmployee.mutateAsync(employeeData);

        addActivity.mutate({
          action: 'Attribution',
          description: `Article "${formData.name}" attribué à ${allocatedData.first_name} ${allocatedData.last_name}`,
          page: 'Employés'
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom *</Label>
                    <Input
                      id="first_name"
                      value={allocatedData.first_name}
                      onChange={(e) => setAllocatedData({ ...allocatedData, first_name: e.target.value })}
                      placeholder="Prénom de la personne"
                      required={formData.status === 'inactive'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <Input
                      id="last_name"
                      value={allocatedData.last_name}
                      onChange={(e) => setAllocatedData({ ...allocatedData, last_name: e.target.value })}
                      placeholder="Nom de la personne"
                      required={formData.status === 'inactive'}
                    />
                  </div>
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

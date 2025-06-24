
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStockCategories } from '@/hooks/useStockCategories';

interface CategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryDialog: React.FC<CategoryDialogProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [criticalThreshold, setCriticalThreshold] = useState('10');
  const { createCategory } = useStockCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCategory.mutateAsync({
        name,
        critical_threshold: parseInt(criticalThreshold),
      });
      
      setName('');
      setCriticalThreshold('10');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
    }
  };

  const resetForm = () => {
    setName('');
    setCriticalThreshold('10');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle catégorie</DialogTitle>
          <DialogDescription>
            Créer une nouvelle catégorie pour organiser votre stock.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threshold" className="text-right">
                Seuil critique
              </Label>
              <Input
                id="threshold"
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(e.target.value)}
                className="col-span-3"
                min="1"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Annuler
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;

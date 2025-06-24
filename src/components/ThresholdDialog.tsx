
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockCategories } from '@/hooks/useStockCategories';

interface ThresholdDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThresholdDialog: React.FC<ThresholdDialogProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [threshold, setThreshold] = useState('');
  const { categories, updateCategory } = useStockCategories();

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        setThreshold(category.critical_threshold.toString());
      }
    }
  }, [selectedCategory, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory || !threshold) return;
    
    try {
      await updateCategory.mutateAsync({
        id: selectedCategory,
        critical_threshold: parseInt(threshold),
      });
      
      setSelectedCategory('');
      setThreshold('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du seuil:', error);
    }
  };

  const resetForm = () => {
    setSelectedCategory('');
    setThreshold('');
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
          <DialogTitle>Modifier le seuil critique</DialogTitle>
          <DialogDescription>
            Modifier le seuil critique d'une catégorie pour les alertes de stock.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} (seuil actuel: {category.critical_threshold})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="threshold" className="text-right">Nouveau seuil</Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
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
            <Button type="submit" disabled={updateCategory.isPending || !selectedCategory}>
              {updateCategory.isPending ? 'Mise à jour...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ThresholdDialog;

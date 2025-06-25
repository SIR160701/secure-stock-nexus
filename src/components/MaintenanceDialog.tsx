
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useStock } from '@/hooks/useStock';
import { useStockCategories } from '@/hooks/useStockCategories';
import { useActivityHistory } from '@/hooks/useActivityHistory';

const maintenanceSchema = z.object({
  item: z.string().min(1, 'L\'équipement est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  problem: z.string().min(1, 'Le problème est requis'),
  technician: z.string().min(1, 'Le technicien est requis'),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed']),
  parkNumber: z.string().optional(),
  serialNumber: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceFormData & { id?: string }) => Promise<void>;
  initialData?: Partial<MaintenanceFormData & { id: string }>;
  mode: 'create' | 'edit';
}

export const MaintenanceDialog: React.FC<MaintenanceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode
}) => {
  const { toast } = useToast();
  const { stockItems, updateStockItem } = useStock();
  const { categories } = useStockCategories();
  const { addActivity } = useActivityHistory();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      item: initialData?.item || '',
      category: initialData?.category || '',
      problem: initialData?.problem || '',
      technician: initialData?.technician || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      status: initialData?.status || 'scheduled',
      parkNumber: initialData?.parkNumber || '',
      serialNumber: initialData?.serialNumber || '',
    }
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const selectedItem = watch('item');
  const selectedParkNumber = watch('parkNumber');

  const availableItems = stockItems.filter(item => item.status === 'active');

  const handleFormSubmit = async (data: MaintenanceFormData) => {
    try {
      const stockItem = stockItems.find(item => item.name === data.item);
      
      if (stockItem && mode === 'create') {
        await updateStockItem.mutateAsync({
          id: stockItem.id,
          status: 'discontinued',
          previous_status: stockItem.status,
        });

        addActivity.mutate({
          action: 'Statut modifié',
          description: `Article "${data.item}" passé en maintenance`,
          page: 'Stock'
        });
      }

      await onSubmit({ ...data, id: initialData?.id });
      
      addActivity.mutate({
        action: mode === 'create' ? 'Création' : 'Modification',
        description: `Maintenance ${mode === 'create' ? 'créée' : 'modifiée'} pour "${data.item}"`,
        page: 'Maintenance'
      });

      toast({
        title: mode === 'create' ? 'Maintenance créée' : 'Maintenance modifiée',
        description: `La maintenance pour ${data.item} a été ${mode === 'create' ? 'créée' : 'modifiée'} avec succès.`,
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleItemChange = (itemName: string) => {
    setValue('item', itemName);
    const item = stockItems.find(i => i.name === itemName);
    if (item) {
      setValue('category', item.category);
    }
    setValue('parkNumber', '');
    setValue('serialNumber', '');
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

  const handleParkNumberChange = (parkNumber: string) => {
    setValue('parkNumber', parkNumber);
    const availableSerials = getAvailableSerialNumbers(selectedItem, parkNumber);
    if (availableSerials.length === 1) {
      setValue('serialNumber', availableSerials[0]);
    } else {
      setValue('serialNumber', '');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {mode === 'create' ? 'Nouvelle maintenance' : 'Modifier la maintenance'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Créer une nouvelle entrée de maintenance' : 'Modifier les détails de la maintenance'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="item">Équipement *</Label>
              <Select onValueChange={handleItemChange} value={watch('item')}>
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
              {errors.item && (
                <p className="text-sm text-red-500 mt-1">{errors.item.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select onValueChange={(value) => setValue('category', value)} value={watch('category')}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie automatique" />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parkNumber">N° de parc</Label>
              <Select 
                onValueChange={handleParkNumberChange} 
                value={watch('parkNumber')}
                disabled={!selectedItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un n° de parc" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableParkNumbers(selectedItem).map((parkNumber) => (
                    <SelectItem key={parkNumber} value={parkNumber}>
                      {parkNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="serialNumber">N° de série</Label>
              <Select 
                onValueChange={(value) => setValue('serialNumber', value)} 
                value={watch('serialNumber')}
                disabled={!selectedItem || !selectedParkNumber}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un n° de série" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableSerialNumbers(selectedItem, selectedParkNumber).map((serialNumber) => (
                    <SelectItem key={serialNumber} value={serialNumber}>
                      {serialNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="problem">Problème / Description *</Label>
            <Textarea
              id="problem"
              placeholder="Décrivez le problème rencontré..."
              {...register('problem')}
              rows={3}
            />
            {errors.problem && (
              <p className="text-sm text-red-500 mt-1">{errors.problem.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="technician">Technicien assigné *</Label>
            <Input
              id="technician"
              placeholder="Ex: Jean Technicien"
              {...register('technician')}
            />
            {errors.technician && (
              <p className="text-sm text-red-500 mt-1">{errors.technician.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setValue('startDate', date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date de fin prévue</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue('endDate', date)}
                    initialFocus
                    disabled={(date) => startDate && date < startDate}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Statut</Label>
            <Select onValueChange={(value: 'scheduled' | 'in_progress' | 'completed') => setValue('status', value)} value={watch('status')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Planifiée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

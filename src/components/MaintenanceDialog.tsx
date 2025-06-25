
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
  onSubmit: (data: MaintenanceFormData & { id?: string }) => void;
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

  // Filtrer les articles disponibles pour maintenance
  const availableItems = stockItems.filter(item => item.status === 'active');

  const handleFormSubmit = async (data: MaintenanceFormData) => {
    // Trouver l'article correspondant dans le stock
    const stockItem = stockItems.find(item => item.name === data.item);
    
    if (stockItem && mode === 'create') {
      // Changer le statut de l'article à "maintenance" dans le stock
      await updateStockItem.mutateAsync({
        id: stockItem.id,
        status: 'discontinued',
        previous_status: stockItem.status, // Sauvegarder le statut précédent
      });

      addActivity.mutate({
        action: 'Statut modifié',
        description: `Article "${data.item}" passé en maintenance`,
        page: 'Stock'
      });
    }

    onSubmit({ ...data, id: initialData?.id });
    
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
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Mettre à jour automatiquement les champs quand un article est sélectionné
  const handleItemChange = (itemName: string) => {
    setValue('item', itemName);
    const item = stockItems.find(i => i.name === itemName);
    if (item) {
      setValue('category', item.category);
      setValue('parkNumber', item.park_number || '');
      setValue('serialNumber', item.serial_number || '');
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
              <Select onValueChange={handleItemChange} defaultValue={initialData?.item}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un équipement" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name} {item.park_number && `(${item.park_number})`}
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
              <Input
                id="parkNumber"
                placeholder="Automatique depuis le stock"
                {...register('parkNumber')}
                readOnly
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">N° de série</Label>
              <Input
                id="serialNumber"
                placeholder="Automatique depuis le stock"
                {...register('serialNumber')}
                readOnly
              />
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
            <Select onValueChange={(value: 'scheduled' | 'in_progress' | 'completed') => setValue('status', value)} defaultValue={initialData?.status || 'scheduled'}>
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

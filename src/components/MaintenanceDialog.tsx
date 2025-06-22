
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

const maintenanceSchema = z.object({
  item: z.string().min(1, 'L\'équipement est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  problem: z.string().min(1, 'Le problème est requis'),
  technician: z.string().min(1, 'Le technicien est requis'),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['en_cours', 'terminee', 'en_retard']),
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
      status: initialData?.status || 'en_cours',
      parkNumber: initialData?.parkNumber || '',
      serialNumber: initialData?.serialNumber || '',
    }
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const handleFormSubmit = (data: MaintenanceFormData) => {
    onSubmit({ ...data, id: initialData?.id });
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
              <Input
                id="item"
                placeholder="Ex: Dell Latitude 5520"
                {...register('item')}
              />
              {errors.item && (
                <p className="text-sm text-red-500 mt-1">{errors.item.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select onValueChange={(value) => setValue('category', value)} defaultValue={initialData?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ordinateurs">Ordinateurs</SelectItem>
                  <SelectItem value="Imprimantes">Imprimantes</SelectItem>
                  <SelectItem value="Téléphones">Téléphones</SelectItem>
                  <SelectItem value="Serveurs">Serveurs</SelectItem>
                  <SelectItem value="Réseaux">Équipements Réseau</SelectItem>
                  <SelectItem value="Autres">Autres</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parkNumber">N° de parc</Label>
              <Input
                id="parkNumber"
                placeholder="Ex: PC-001"
                {...register('parkNumber')}
              />
            </div>

            <div>
              <Label htmlFor="serialNumber">N° de série</Label>
              <Input
                id="serialNumber"
                placeholder="Ex: ABC123456"
                {...register('serialNumber')}
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
            <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={initialData?.status || 'en_cours'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="terminee">Terminée</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
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

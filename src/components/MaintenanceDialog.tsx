
import React, { useState, useEffect } from 'react';
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
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';

const maintenanceSchema = z.object({
  problem: z.string().min(1, 'Le problème est requis'),
  technician: z.string().min(1, 'Le technicien est requis'),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceFormData & { id?: string }) => void;
  initialData?: Partial<MaintenanceFormData & { id: string; item: string; category: string; parkNumber: string; serialNumber: string }>;
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
  const { addActivity } = useActivityHistory();
  const { users } = useUsers();
  
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
      problem: initialData?.problem || '',
      technician: initialData?.technician || '',
      startDate: initialData?.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData?.endDate ? new Date(initialData.endDate) : undefined,
      status: initialData?.status || 'scheduled',
      priority: initialData?.priority || 'medium',
    }
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    if (initialData) {
      setValue('problem', initialData.problem || '');
      setValue('technician', initialData.technician || '');
      setValue('startDate', initialData.startDate ? new Date(initialData.startDate) : new Date());
      setValue('endDate', initialData.endDate ? new Date(initialData.endDate) : undefined);
      setValue('status', initialData.status || 'scheduled');
      setValue('priority', initialData.priority || 'medium');
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: MaintenanceFormData) => {
    try {
      await onSubmit({ ...data, id: initialData?.id });
      
      // Envoyer un email au technicien si assigné
      if (data.technician && mode === 'create') {
        const selectedUser = users.find(u => u.id === data.technician);
        if (selectedUser && selectedUser.email) {
          try {
            await supabase.functions.invoke('send-maintenance-email', {
              body: {
                technicianEmail: selectedUser.email,
                technicianName: selectedUser.full_name || selectedUser.email,
                equipmentName: initialData?.item || 'Équipement non spécifié',
                parkNumber: initialData?.parkNumber || '',
                serialNumber: initialData?.serialNumber || '',
                description: data.problem,
                priority: data.priority,
                scheduledDate: data.startDate.toISOString()
              }
            });
          } catch (emailError) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailError);
          }
        }
      }
      
      addActivity.mutate({
        action: mode === 'create' ? 'Création' : 'Modification',
        description: `Maintenance ${mode === 'create' ? 'créée' : 'modifiée'}`,
        page: 'Maintenance'
      });

      reset();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    }
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
            Modifier la maintenance
          </DialogTitle>
          <DialogDescription>
            Modifier les détails de la maintenance (seuls certains champs sont modifiables)
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
            <Select onValueChange={(value) => setValue('technician', value)} defaultValue={initialData?.technician || ''}>
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
            <Select onValueChange={(value: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => setValue('status', value)} defaultValue={initialData?.status || 'scheduled'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Planifiée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priorité</Label>
            <Select onValueChange={(value: 'low' | 'medium' | 'high') => setValue('priority', value)} defaultValue={initialData?.priority || 'medium'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit">
              Modifier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

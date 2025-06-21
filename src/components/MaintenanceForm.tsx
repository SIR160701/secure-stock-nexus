
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Settings, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceData) => void;
  article: {
    model: string;
    parkNumber: string;
    serialNumber: string;
  };
}

export interface MaintenanceData {
  technician: string;
  startDate: Date;
  endDate?: Date;
  problem: string;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  article
}) => {
  const [formData, setFormData] = useState<MaintenanceData>({
    technician: '',
    startDate: new Date(),
    endDate: undefined,
    problem: ''
  });

  const handleSubmit = () => {
    if (!formData.technician || !formData.problem) {
      return;
    }
    onSubmit(formData);
    setFormData({
      technician: '',
      startDate: new Date(),
      endDate: undefined,
      problem: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Envoyer en maintenance
          </DialogTitle>
          <DialogDescription>
            Article: {article.model} ({article.parkNumber})
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="technician" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom du technicien *
            </Label>
            <Input
              id="technician"
              placeholder="Ex: Jean Technicien"
              value={formData.technician}
              onChange={(e) => setFormData({...formData, technician: e.target.value})}
            />
          </div>

          <div>
            <Label>Date de début *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "dd/MM/yyyy") : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.startDate}
                  onSelect={(date) => date && setFormData({...formData, startDate: date})}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Date de fin (facultatif)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.endDate ? format(formData.endDate, "dd/MM/yyyy") : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.endDate}
                  onSelect={(date) => setFormData({...formData, endDate: date})}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(date) => date < formData.startDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="problem">Problème / Raison *</Label>
            <Textarea
              id="problem"
              placeholder="Décrivez le problème rencontré..."
              value={formData.problem}
              onChange={(e) => setFormData({...formData, problem: e.target.value})}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!formData.technician || !formData.problem}
          >
            Envoyer en maintenance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key } from 'lucide-react';
import { ChatService } from '@/services/chatService';

interface ChatApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
}

export const ChatApiKeyDialog: React.FC<ChatApiKeyDialogProps> = ({
  isOpen,
  onClose,
  onApiKeySet
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsLoading(true);
    try {
      // Test de la clé API avec un message simple
      const testService = new ChatService({ apiKey });
      await testService.sendMessage([
        { id: '1', role: 'user', content: 'Test', timestamp: new Date() }
      ]);
      
      ChatService.saveApiKey(apiKey);
      onApiKeySet(apiKey);
      onClose();
      setApiKey('');
    } catch (error) {
      alert('Clé API invalide. Veuillez vérifier votre clé OpenAI.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuration OpenAI
          </DialogTitle>
          <DialogDescription>
            Entrez votre clé API OpenAI pour activer le chat avec GPT-4
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="apiKey">Clé API OpenAI</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important :</p>
              <p>Votre clé API sera stockée localement dans votre navigateur. Pour une sécurité optimale, utilisez l'intégration Supabase.</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Test en cours...' : 'Configurer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Shield, Database, Bot, Palette, Download } from 'lucide-react';

const Settings = () => {
  const { user, hasPermission } = useAuth();

  // DEBUG: Affichage temporaire du contexte utilisateur
  console.log('user:', user);
  console.log('hasPermission:', hasPermission);

  // Désactive temporairement la restriction admin pour diagnostic
  // if (!hasPermission('admin')) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="text-center">
  //         <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  //         <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
  //         <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder aux paramètres.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">Configurez votre application Secure Stock</p>
      </div>

      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Gestion des utilisateurs</span>
          </CardTitle>
          <CardDescription>
            Ajoutez, modifiez ou supprimez des utilisateurs et gérez leurs permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-user-name">Nom d'utilisateur</Label>
              <Input id="new-user-name" placeholder="Nom complet" />
            </div>
            <div>
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" type="email" placeholder="email@exemple.com" />
            </div>
          </div>
          <Button>Ajouter un utilisateur</Button>
        </CardContent>
      </Card>

      {/* Paramètres de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Sécurité</span>
          </CardTitle>
          <CardDescription>
            Configurez les paramètres de sécurité de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Authentification à deux facteurs</Label>
              <p className="text-sm text-gray-600">Activer la 2FA pour tous les utilisateurs</p>
            </div>
            <Switch id="2fa" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-policy">Politique de mot de passe strict</Label>
              <p className="text-sm text-gray-600">Exiger des mots de passe complexes</p>
            </div>
            <Switch id="password-policy" />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres du stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Paramètres du stock</span>
          </CardTitle>
          <CardDescription>
            Configurez les seuils et alertes pour la gestion du stock.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="default-threshold">Seuil critique par défaut</Label>
            <Input id="default-threshold" type="number" defaultValue="10" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="stock-alerts">Alertes de stock bas</Label>
              <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
            </div>
            <Switch id="stock-alerts" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Paramètres du chatbot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Configuration du Chatbot</span>
          </CardTitle>
          <CardDescription>
            Configurez l'intégration avec OpenAI ChatGPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="openai-key">Clé API OpenAI</Label>
            <Input id="openai-key" type="password" placeholder="sk-..." />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="chatbot-enabled">Activer le chatbot</Label>
              <p className="text-sm text-gray-600">Permettre l'accès au chat pour tous les utilisateurs</p>
            </div>
            <Switch id="chatbot-enabled" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Personnalisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Personnalisation</span>
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de votre application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="app-name">Nom de l'application</Label>
            <Input id="app-name" defaultValue="Secure Stock" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="dark-mode">Mode sombre</Label>
              <p className="text-sm text-gray-600">Utiliser le thème sombre par défaut</p>
            </div>
            <Switch id="dark-mode" />
          </div>
        </CardContent>
      </Card>

      {/* Sauvegarde et restauration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Sauvegarde et restauration</span>
          </CardTitle>
          <CardDescription>
            Gérez les sauvegardes de vos données.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button variant="outline">Exporter les données</Button>
            <Button variant="outline">Importer les données</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-backup">Sauvegarde automatique</Label>
              <p className="text-sm text-gray-600">Sauvegarder automatiquement chaque semaine</p>
            </div>
            <Switch id="auto-backup" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline">Annuler</Button>
        <Button>Enregistrer les modifications</Button>
      </div>
    </div>
  );
};

export default Settings;


import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const AppHeader = () => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Secure Stock</h1>
          <p className="text-xs text-gray-500">Gestion opérationnelle</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Utilisateur'}</p>
          <p className="text-xs text-gray-500 capitalize">
            {profile?.role?.replace('_', ' ') || 'user'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSignOut}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;

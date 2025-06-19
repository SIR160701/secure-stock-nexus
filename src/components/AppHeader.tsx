
import React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const AppHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold">Secure Stock</h1>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={logout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

export default AppHeader;

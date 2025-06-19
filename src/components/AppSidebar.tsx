
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  ChartPie, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: ChartPie,
    roles: ['super_admin', 'admin', 'user']
  },
  {
    title: 'Stock',
    url: '/stock',
    icon: FileText,
    roles: ['super_admin', 'admin', 'user']
  },
  {
    title: 'Employés',
    url: '/employees',
    icon: Users,
    roles: ['super_admin', 'admin', 'user']
  },
  {
    title: 'Maintenance',
    url: '/maintenance',
    icon: Settings,
    roles: ['super_admin', 'admin', 'user']
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageSquare,
    roles: ['super_admin', 'admin', 'user']
  },
  {
    title: 'Paramètres',
    url: '/settings',
    icon: Settings,
    roles: ['super_admin', 'admin']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isCollapsed = state === "collapsed";
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">SS</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg">Secure Stock</h2>
              <p className="text-xs text-muted-foreground">Gestion opérationnelle</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t mt-auto">
        {!isCollapsed && user && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
            <p className="text-xs text-muted-foreground">{user.department}</p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

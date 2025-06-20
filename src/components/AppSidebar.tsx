
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
  BarChart3, 
  Users, 
  Package, 
  MessageSquare, 
  Settings, 
  Wrench 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: BarChart3,
    roles: ['super_admin', 'admin', 'user'],
    color: 'text-blue-600'
  },
  {
    title: 'Stock',
    url: '/stock',
    icon: Package,
    roles: ['super_admin', 'admin', 'user'],
    color: 'text-green-600'
  },
  {
    title: 'Employés',
    url: '/employees',
    icon: Users,
    roles: ['super_admin', 'admin', 'user'],
    color: 'text-purple-600'
  },
  {
    title: 'Maintenance',
    url: '/maintenance',
    icon: Wrench,
    roles: ['super_admin', 'admin', 'user'],
    color: 'text-orange-600'
  },
  {
    title: 'Chat',
    url: '/chat',
    icon: MessageSquare,
    roles: ['super_admin', 'admin', 'user'],
    color: 'text-pink-600'
  },
  {
    title: 'Paramètres',
    url: '/settings',
    icon: Settings,
    roles: ['super_admin', 'admin'],
    color: 'text-gray-600'
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

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SS</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-white">Secure Stock</h2>
              <p className="text-xs text-blue-100">Gestion opérationnelle</p>
            </div>
          )}
        </div>
      </div>

      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 font-semibold">
            {!isCollapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => `
                        flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 text-blue-700 shadow-md' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                        }
                      `}
                    >
                      <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-blue-600' : item.color}`} />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="p-4 border-t mt-auto bg-gray-50">
        {!isCollapsed && user && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">{user.department}</p>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

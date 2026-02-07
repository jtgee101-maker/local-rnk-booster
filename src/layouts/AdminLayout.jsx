import React, { useState, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/lib/AuthContext';

// Icons
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  LogOut,
  ChevronDown,
  Activity,
  BarChart3,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

// Sidebar Context
const SidebarContext = createContext({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

// Navigation items by role
const getNavigationItems = (role) => {
  const allItems = [
    {
      section: 'Overview',
      items: [
        { name: 'Dashboard', href: 'AdminDashboard', icon: LayoutDashboard, roles: ['super-admin', 'admin', 'support'] },
        { name: 'Analytics', href: 'AdminAnalytics', icon: BarChart3, roles: ['super-admin', 'admin'] },
        { name: 'Activity', href: 'AdminActivity', icon: Activity, roles: ['super-admin', 'admin', 'support'] },
      ]
    },
    {
      section: 'Management',
      items: [
        { name: 'Users', href: 'AdminUsers', icon: Users, roles: ['super-admin', 'admin'] },
        { name: 'Tenants', href: 'AdminTenants', icon: Building2, roles: ['super-admin', 'admin'] },
        { name: 'System Health', href: 'AdminHealth', icon: CheckCircle2, roles: ['super-admin', 'admin', 'support'] },
      ]
    },
    {
      section: 'System',
      items: [
        { name: 'Notifications', href: 'AdminNotifications', icon: Bell, badge: 3, roles: ['super-admin', 'admin', 'support'] },
        { name: 'Email Logs', href: 'AdminEmailLogs', icon: Mail, roles: ['super-admin', 'admin'] },
        { name: 'Reports', href: 'AdminReports', icon: FileText, roles: ['super-admin', 'admin'] },
        { name: 'Settings', href: 'AdminSettings', icon: Settings, roles: ['super-admin'] },
      ]
    }
  ];

  return allItems.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(role))
  })).filter(section => section.items.length > 0);
};

// Role badge component
const RoleBadge = ({ role }) => {
  const styles = {
    'super-admin': 'bg-red-500/10 text-red-500 border-red-500/20',
    'admin': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'support': 'bg-green-500/10 text-green-500 border-green-500/20',
    'user': 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  return (
    <Badge variant="outline" className={cn('text-xs capitalize', styles[role] || styles.user)}>
      {role.replace('-', ' ')}
    </Badge>
  );
};

// Sidebar Item Component
const SidebarItem = ({ item, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === `/${item.href}`;

  const content = (
    <Link
      to={createPageUrl(item.href)}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
        isActive 
          ? 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      )}
    >
      <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-[#c8ff00]')} />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-medium">{item.name}</span>
          {item.badge && (
            <Badge variant="secondary" className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 border-slate-700">
            <div className="flex items-center gap-2">
              <span>{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

// Breadcrumb Generator
const BreadcrumbNav = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0) return null;

  const formatLabel = (segment) => {
    return segment
      .replace(/-/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={createPageUrl('AdminDashboard')} className="text-slate-400 hover:text-white">
              Admin
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = pathSegments.slice(0, index + 1).join('/');
          
          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator className="text-slate-600" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-white">{formatLabel(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={`/${href}`} className="text-slate-400 hover:text-white">
                      {formatLabel(segment)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

// Main Admin Layout
export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mock user role - in real app, get from auth context
  const userRole = user?.role || 'super-admin';
  const userName = user?.name || 'Admin User';
  const userEmail = user?.email || 'admin@localrnk.com';
  const userAvatar = user?.avatar;

  const navigation = getNavigationItems(userRole);

  const handleLogout = async () => {
    await logout();
    navigate(createPageUrl('Home'));
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300',
            collapsed ? 'w-[72px]' : 'w-64',
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <Link to={createPageUrl('AdminDashboard')} className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
              <div className="w-8 h-8 bg-[#c8ff00] rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-slate-900" />
              </div>
              {!collapsed && (
                <span className="text-white font-bold text-lg">Super Admin</span>
              )}
            </Link>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hidden lg:flex"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white absolute -right-3 top-6 bg-slate-800 rounded-full w-6 h-6 hidden lg:flex"
                onClick={() => setCollapsed(false)}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Sidebar Navigation */}
          <div className="py-4 px-3 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
            {navigation.map((section) => (
              <div key={section.section}>
                {!collapsed && (
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem key={item.name} item={item} collapsed={collapsed} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <div className={cn(
          'transition-all duration-300 min-h-screen',
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}>
          {/* Header */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
            <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
              {/* Left: Mobile Menu & Breadcrumbs */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="hidden sm:block">
                  <BreadcrumbNav />
                </div>
              </div>

              {/* Center: Search */}
              <div className="flex-1 max-w-md hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Search users, tenants, settings..."
                    className="pl-10 bg-slate-100 dark:bg-slate-800 border-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Right: Notifications & User Menu */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Notifications</span>
                      <Badge variant="secondary" className="bg-red-500 text-white">3 new</Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto">
                      <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex items-center gap-2 w-full">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-sm">High error rate detected</span>
                          <span className="text-xs text-slate-400 ml-auto">2m ago</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-6">Error rate exceeded 5% in the last hour</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex items-center gap-2 w-full">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-sm">New user registered</span>
                          <span className="text-xs text-slate-400 ml-auto">15m ago</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-6">Acme Corp just signed up</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex items-center gap-2 w-full">
                          <Building2 className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-sm">Tenant activated</span>
                          <span className="text-xs text-slate-400 ml-auto">1h ago</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-6">TechStart Inc. subscription activated</p>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-sm text-slate-500 cursor-pointer">
                      View all notifications
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback className="bg-[#c8ff00] text-slate-900 text-sm font-medium">
                          {userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium leading-none">{userName}</p>
                        <p className="text-xs text-slate-500">{userEmail}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>My Account</span>
                      <RoleBadge role={userRole} />
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <UserCog className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Security
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

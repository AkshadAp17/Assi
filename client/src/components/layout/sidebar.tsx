import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Folder, 
  Users, 
  Settings, 
  Gamepad2, 
  LogOut,
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      // Force redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect anyway
      window.location.href = '/login';
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      testId: "nav-dashboard",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: Folder,
      testId: "nav-projects",
    },
    ...(user?.role === 'admin' ? [{
      name: "User Management",
      href: "/users",
      icon: Users,
      testId: "nav-users",
    }] : []),
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      testId: "nav-settings",
    },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50 hidden" 
        id="sidebar-overlay"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('sidebar-overlay');
          if (sidebar && overlay) {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
          }
        }}
      ></div>
      
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out" id="sidebar">
        <div className="flex flex-col h-full">
        {/* Enhanced Header */}
        <div className="relative h-20 px-4 flex items-center justify-between border-b border-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50"></div>
          <div className="relative flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gamepad2 className="text-white h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">PixelForge Nexus</span>
              <p className="text-xs text-gray-500 -mt-1">Project Manager</p>
            </div>
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden relative z-10"
            onClick={() => {
              const sidebar = document.getElementById('sidebar');
              const overlay = document.getElementById('sidebar-overlay');
              if (sidebar && overlay) {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('hidden');
              }
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Role Badge */}
        <div className="px-4 py-2">
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold",
            user.role === 'admin' ? "bg-red-100 text-red-800 border border-red-200" :
            user.role === 'project_lead' ? "bg-blue-100 text-blue-800 border border-blue-200" :
            "bg-green-100 text-green-800 border border-green-200"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              user.role === 'admin' ? "bg-red-500" :
              user.role === 'project_lead' ? "bg-blue-500" :
              "bg-green-500"
            )}></div>
            {user.role === 'project_lead' ? 'Project Lead' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  )}
                  data-testid={item.testId}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl opacity-100"></div>
                  )}
                  <div className="relative flex items-center w-full">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200",
                      isActive 
                        ? "bg-white shadow-sm" 
                        : "bg-gray-100 group-hover:bg-gray-200"
                    )}>
                      <item.icon 
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          isActive 
                            ? "text-indigo-600" 
                            : "text-gray-500 group-hover:text-gray-700"
                        )} 
                      />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Enhanced User Profile */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-indigo-200 shadow-lg">
                <AvatarImage 
                  src={user.profileImageUrl || undefined}
                  alt={user.firstName || user.email || 'User'}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate" data-testid="text-sidebar-user-name">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email?.split('@')[0] || 'User'
                }
              </p>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium",
                  user.role === 'admin' ? "bg-red-100 text-red-800" :
                  user.role === 'project_lead' ? "bg-blue-100 text-blue-800" :
                  "bg-green-100 text-green-800"
                )}>
                  {user.role === 'project_lead' ? 'Project Lead' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              data-testid="button-sidebar-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

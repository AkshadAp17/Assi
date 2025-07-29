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
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    // Force redirect to logout endpoint and then to login
    window.location.replace("/api/logout");
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
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
      <div className="flex flex-col h-full">
        {/* Enhanced Header */}
        <div className="relative h-20 px-4 flex items-center justify-center border-b border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm"></div>
          <div className="relative flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <Gamepad2 className="text-white h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">GameDev PM</span>
              <p className="text-xs text-gray-400 -mt-1">Project Manager</p>
            </div>
          </div>
        </div>
        
        {/* Role Badge */}
        <div className="px-4 py-2">
          <div className={cn(
            "inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold",
            user.role === 'admin' ? "bg-red-500/20 text-red-300 border border-red-500/30" :
            user.role === 'project_lead' ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
            "bg-green-500/20 text-green-300 border border-green-500/30"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              user.role === 'admin' ? "bg-red-400" :
              user.role === 'project_lead' ? "bg-blue-400" :
              "bg-green-400"
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
                    "group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105",
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm"
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
                        ? "bg-white/20 shadow-sm" 
                        : "bg-gray-700/50 group-hover:bg-white/10"
                    )}>
                      <item.icon 
                        className={cn(
                          "h-4 w-4 transition-all duration-200",
                          isActive 
                            ? "text-white" 
                            : "text-gray-400 group-hover:text-white"
                        )} 
                      />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full opacity-75"></div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Enhanced User Profile */}
        <div className="border-t border-slate-700/50 p-4 bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-indigo-500/30 shadow-lg">
                <AvatarImage 
                  src={user.profileImageUrl || undefined}
                  alt={user.firstName || user.email || 'User'}
                />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate" data-testid="text-sidebar-user-name">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email?.split('@')[0] || 'User'
                }
              </p>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium",
                  user.role === 'admin' ? "bg-red-500/20 text-red-300" :
                  user.role === 'project_lead' ? "bg-blue-500/20 text-blue-300" :
                  "bg-green-500/20 text-green-300"
                )}>
                  {user.role === 'project_lead' ? 'Project Lead' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200"
              data-testid="button-sidebar-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

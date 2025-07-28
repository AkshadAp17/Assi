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
    window.location.href = "/api/logout";
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
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Gamepad2 className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold text-gray-900">GameDev PM</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "nav-item group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "sidebar-active"
                      : "sidebar-inactive"
                  )}
                  data-testid={item.testId}
                >
                  <item.icon 
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive 
                        ? "text-primary" 
                        : "text-gray-400 group-hover:text-gray-500"
                    )} 
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user.profileImageUrl || undefined}
                alt={user.firstName || user.email || 'User'}
              />
              <AvatarFallback>
                {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate" data-testid="text-sidebar-user-name">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </p>
              <p className="text-xs text-gray-500 truncate" data-testid="text-sidebar-user-role">
                {user.role === 'project_lead' ? 'Project Lead' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-500"
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

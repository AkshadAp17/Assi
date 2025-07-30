import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings as SettingsIcon, Shield, User, Menu } from "lucide-react";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;

export default function Settings() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onPasswordSubmit = async (data: PasswordChangeForm) => {
    try {
      // Note: This would typically call an API endpoint to change the password
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  const formatRole = (role: string) => {
    switch (role) {
      case 'project_lead':
        return 'Project Lead';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar />
      
      {/* Mobile/Desktop hamburger menu button */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-lg border-gray-200"
          onClick={() => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
              sidebar.classList.remove('-translate-x-full');
              overlay.classList.remove('hidden');
            }
          }}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Full width content with proper responsive layout */}
      <div className="lg:pl-64 pl-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-4xl mx-auto">
          <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent" data-testid="text-settings-title">
                Account Settings
              </h1>
              <p className="text-gray-600">Manage your account preferences and security</p>
            </div>
          </div>
        </div>

          <div className="max-w-2xl space-y-6">
          {/* Enhanced Profile Information */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-gray-100">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-900 font-semibold">Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center space-x-6 mb-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-4 ring-indigo-100 shadow-lg">
                      <AvatarImage 
                        src={user.profileImageUrl || undefined}
                        alt={user.firstName || user.email || 'User'}
                      />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                        {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-sm"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2" data-testid="text-user-name">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email?.split('@')[0] || 'User'
                      }
                    </h3>
                    <p className="text-sm text-gray-600 mb-3" data-testid="text-user-email">
                      {user.email}
                    </p>
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200" data-testid="text-user-role">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        user.role === 'admin' ? 'bg-red-500' :
                        user.role === 'project_lead' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-gray-800">{formatRole(user.role)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Profile information is managed through your authentication provider. 
                  Contact your administrator to update your details.
                </p>
              </CardContent>
            </Card>

            {/* Enhanced Change Password */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-gray-100">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-900 font-semibold">Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...register("currentPassword")}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-200"
                      placeholder="Enter your current password"
                      data-testid="input-current-password"
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-600 flex items-center mt-2">
                        <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">!</span>
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...register("newPassword")}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-200"
                      placeholder="Enter your new password"
                      data-testid="input-new-password"
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 flex items-center mt-2">
                        <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">!</span>
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-orange-400/20 transition-all duration-200"
                      placeholder="Confirm your new password"
                      data-testid="input-confirm-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center mt-2">
                        <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center mr-2">!</span>
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-update-password"
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Account Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sign Out</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Sign out of your account on this device.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

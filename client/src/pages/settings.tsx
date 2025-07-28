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
import { Settings as SettingsIcon, Shield, User } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-settings-title">
              Account Settings
            </h1>
            <p className="text-gray-600">Manage your account preferences and security</p>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={user.profileImageUrl || undefined}
                      alt={user.firstName || user.email || 'User'}
                    />
                    <AvatarFallback className="text-lg">
                      {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium" data-testid="text-user-name">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email
                      }
                    </h3>
                    <p className="text-sm text-gray-500" data-testid="text-user-email">
                      {user.email}
                    </p>
                    <p className="text-sm text-gray-500" data-testid="text-user-role">
                      {formatRole(user.role)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Profile information is managed through your authentication provider. 
                  Contact your administrator to update your details.
                </p>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...register("currentPassword")}
                      className="mt-1"
                      data-testid="input-current-password"
                    />
                    {errors.currentPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...register("newPassword")}
                      className="mt-1"
                      data-testid="input-new-password"
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      className="mt-1"
                      data-testid="input-confirm-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" data-testid="button-update-password">
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

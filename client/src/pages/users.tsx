import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateUserDialog } from "@/components/user/create-user-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UserPlus, Edit, Trash2, Users as UsersIcon, Menu } from "lucide-react";
import type { UserWithStats } from "@shared/schema";

export default function Users() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const isMobile = useIsMobile();

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

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest('PATCH', `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'project_lead':
        return 'bg-blue-100 text-blue-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'project_lead':
        return 'Project Lead';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Sidebar />
      <div className={`transition-all duration-300 ${isMobile ? 'pl-0' : 'pl-64'}`}>
        {/* Mobile menu button */}
        {isMobile && (
          <div className="lg:hidden fixed top-4 left-4 z-50">
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
        )}
        <div className={`p-4 lg:p-8 ${isMobile ? 'pt-16' : ''}`}>
          {/* Enhanced Header */}
          <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent" data-testid="text-users-title">
                User Management
              </h1>
              <p className="text-gray-600 font-medium">Manage your team members and their roles</p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-lg"
              data-testid="button-create-user"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-semibold">Add User</span>
            </Button>
          </div>

          {/* Enhanced Card with Modern Design */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-gray-100 pb-6">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <UsersIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">Team Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="space-y-4 p-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl"></div>
                    </div>
                  ))}
                </div>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-gray-100 hover:bg-transparent">
                        <TableHead className="font-semibold text-gray-700 py-4 px-6">User</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4 px-6">Role</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4 px-6">Projects</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4 px-6">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData, index) => (
                        <TableRow 
                          key={userData.id} 
                          data-testid={`user-row-${userData.id}`}
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-gray-50"
                        >
                          <TableCell className="py-6 px-6">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                                  <AvatarImage 
                                    src={userData.profileImageUrl || undefined}
                                    alt={userData.firstName || userData.email || 'User'}
                                  />
                                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                                    {(userData.firstName?.[0] || userData.email?.[0] || 'U').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white"></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-gray-900 truncate" data-testid={`text-user-name-${userData.id}`}>
                                  {userData.firstName && userData.lastName
                                    ? `${userData.firstName} ${userData.lastName}`
                                    : userData.email
                                  }
                                </p>
                                <p className="text-sm text-gray-500 truncate" data-testid={`text-user-email-${userData.id}`}>
                                  {userData.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            {userData.role === 'admin' ? (
                              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-3 py-1.5 font-semibold shadow-md">
                                Admin
                              </Badge>
                            ) : (
                              <Select
                                value={userData.role}
                                onValueChange={(role) => 
                                  updateRoleMutation.mutate({ userId: userData.id, role })
                                }
                                disabled={updateRoleMutation.isPending}
                              >
                                <SelectTrigger className="w-36 border-2 border-gray-200 hover:border-indigo-300 rounded-lg transition-colors">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="project_lead">Project Lead</SelectItem>
                                  <SelectItem value="developer">Developer</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="py-6 px-6" data-testid={`text-user-project-count-${userData.id}`}>
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              <span className="font-medium text-gray-700">
                                {userData.role === 'admin' 
                                  ? "All projects" 
                                  : `${userData._count.projectAssignments} projects`
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-6">
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5 font-semibold shadow-md">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 px-6 text-right">
                            <div className="flex justify-end space-x-3">
                              {userData.role !== 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteUserMutation.mutate(userData.id)}
                                  disabled={deleteUserMutation.isPending || userData.id === user.id}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full h-10 w-10 p-0 transition-all duration-200 shadow-sm hover:shadow-md"
                                  data-testid={`button-delete-user-${userData.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {userData.role === 'admin' && (
                                <Badge variant="outline" className="text-gray-500 bg-gray-50 border-gray-200 px-3 py-1">
                                  System Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16 px-6">
                  <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <UsersIcon className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No team members yet</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by adding your first team member to begin collaborating on projects.</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 rounded-lg"
                    data-testid="button-create-first-user"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Your First User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showCreateDialog && (
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}

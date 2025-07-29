import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
import { UserPlus, Edit, Trash2, Users as UsersIcon } from "lucide-react";
import type { UserWithStats } from "@shared/schema";

export default function Users() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-users-title">
                User Management
              </h1>
              <p className="text-gray-600">Manage team members and their roles</p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2"
              data-testid="button-create-user"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UsersIcon className="h-5 w-5" />
                <span>Team Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : users && users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userData) => (
                      <TableRow key={userData.id} data-testid={`user-row-${userData.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={userData.profileImageUrl || undefined}
                                alt={userData.firstName || userData.email || 'User'}
                              />
                              <AvatarFallback>
                                {(userData.firstName?.[0] || userData.email?.[0] || 'U').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm" data-testid={`text-user-name-${userData.id}`}>
                                {userData.firstName && userData.lastName
                                  ? `${userData.firstName} ${userData.lastName}`
                                  : userData.email
                                }
                              </p>
                              <p className="text-sm text-gray-500" data-testid={`text-user-email-${userData.id}`}>
                                {userData.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {userData.role === 'admin' ? (
                            <Badge className={getRoleColor(userData.role)}>
                              {formatRole(userData.role)}
                            </Badge>
                          ) : (
                            <Select
                              value={userData.role}
                              onValueChange={(role) => 
                                updateRoleMutation.mutate({ userId: userData.id, role })
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="project_lead">Project Lead</SelectItem>
                                <SelectItem value="developer">Developer</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-user-project-count-${userData.id}`}>
                          {userData.role === 'admin' 
                            ? "All projects" 
                            : `${userData._count.projectAssignments} projects`
                          }
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {userData.role !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(userData.id)}
                                disabled={deleteUserMutation.isPending || userData.id === user.id}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-user-${userData.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {userData.role === 'admin' && (
                              <span className="text-sm text-gray-500 px-2 py-1">System Admin</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500 mb-4">Get started by adding your first team member.</p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    data-testid="button-create-first-user"
                  >
                    Add User
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

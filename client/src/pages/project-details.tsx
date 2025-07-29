import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { UploadDocumentDialog } from "@/components/document/upload-document-dialog";
import { DocumentList } from "@/components/document/document-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Gamepad2, 
  Users, 
  Calendar, 
  FileText, 
  Upload, 
  Download, 
  UserPlus, 
  UserMinus,
  Trash2
} from "lucide-react";
import type { ProjectWithDetails, UserWithStats } from "@shared/schema";

export default function ProjectDetails() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

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

  const { data: project, isLoading: projectLoading, error } = useQuery<ProjectWithDetails>({
    queryKey: ["/api/projects", id],
    retry: false,
    enabled: !!id,
  });

  const { data: users } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: user?.role === 'admin' || user?.role === 'project_lead',
  });

  const assignUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('POST', `/api/projects/${id}/assign`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      setSelectedUserId("");
      toast({
        title: "Success",
        description: "User assigned to project successfully",
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
        description: "Failed to assign user to project",
        variant: "destructive",
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest('DELETE', `/api/projects/${id}/assign/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "Success",
        description: "User removed from project successfully",
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
        description: "Failed to remove user from project",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
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
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="pl-64 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="pl-64 p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
            <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canAssignUsers = user.role === 'admin' || user.role === 'project_lead';
  const canUploadDocuments = user.role === 'admin' || user.role === 'project_lead';
  const canDeleteDocuments = user.role === 'admin' || user.role === 'project_lead';

  const availableUsers = users?.filter(u => 
    (u.role === 'project_lead' || u.role === 'developer') && !project.assignments.some(assignment => assignment.userId === u.id)
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900" data-testid="text-project-name">
                  {project.name}
                </h1>
                <p className="text-gray-600" data-testid="text-project-description">
                  {project.description || 'No description provided'}
                </p>
              </div>
              <Badge className={getStatusColor(project.status)} data-testid="badge-project-status">
                {project.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Deadline:</span>
                <span className="font-medium" data-testid="text-project-deadline">
                  {formatDate(project.deadline)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Team Size:</span>
                <span className="font-medium" data-testid="text-project-team-size">
                  {project._count.assignments} members
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Documents:</span>
                <span className="font-medium" data-testid="text-project-document-count">
                  {project._count.documents} files
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Team Members</span>
                </CardTitle>
                {canAssignUsers && availableUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email
                                }
                              </span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {user.role === 'project_lead' ? 'Lead' : 'Developer'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => selectedUserId && assignUserMutation.mutate(selectedUserId)}
                      disabled={!selectedUserId || assignUserMutation.isPending}
                      data-testid="button-assign-user"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {project.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {project.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        data-testid={`assignment-${assignment.user.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={assignment.user.profileImageUrl || undefined}
                              alt={assignment.user.firstName || assignment.user.email || 'User'}
                            />
                            <AvatarFallback>
                              {(assignment.user.firstName?.[0] || assignment.user.email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm" data-testid={`text-user-name-${assignment.user.id}`}>
                              {assignment.user.firstName && assignment.user.lastName
                                ? `${assignment.user.firstName} ${assignment.user.lastName}`
                                : assignment.user.email
                              }
                            </p>
                            <p className="text-xs text-gray-500" data-testid={`text-user-email-${assignment.user.id}`}>
                              {assignment.user.email}
                            </p>
                          </div>
                        </div>
                        {canAssignUsers && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserMutation.mutate(assignment.user.id)}
                            disabled={removeUserMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-remove-user-${assignment.user.id}`}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No team members assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Documents</span>
                </CardTitle>
                {canUploadDocuments && (
                  <Button
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                    data-testid="button-upload-document"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <DocumentList projectId={project.id} documents={project.documents} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showUploadDialog && (
        <UploadDocumentDialog
          projectId={id!}
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
        />
      )}
    </div>
  );
}

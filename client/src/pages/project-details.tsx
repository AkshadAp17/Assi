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
  Trash2,
  Menu
} from "lucide-react";
// Define types locally to avoid import issues
interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  deadline: Date | null;
  status: 'active' | 'completed' | 'on_hold';
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  projectLead?: { id: string; firstName: string | null; lastName: string | null; email: string };
  projectLeadId: string | null;
  assignments: Array<{
    id: string;
    projectId: string;
    userId: string;
    assignedBy: string;
    user: { id: string; firstName: string | null; lastName: string | null; email: string; profileImageUrl: string | null; role: string };
    createdAt: Date | null;
  }>;
  documents: any[];
  _count: { assignments: number; documents: number };
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface UserWithStats {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'project_lead' | 'developer';
  profileImageUrl: string | null;
  _count: { projectAssignments: number };
}

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

  // Filter available users based on current user's role
  const availableUsers = users?.filter(u => {
    // Already assigned users cannot be assigned again
    if (project.assignments.some(assignment => assignment.userId === u.id)) {
      return false;
    }
    
    // Admins can only assign Project Leads to projects
    if (user.role === 'admin') {
      return u.role === 'project_lead';
    }
    
    // Project Leads can only assign Developers
    if (user.role === 'project_lead') {
      return u.role === 'developer';
    }
    
    return false;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <Sidebar />
      
      {/* Mobile/Desktop hamburger menu button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
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

      <div className="lg:pl-64 pl-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          {/* Enhanced Project Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-indigo-100">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2" data-testid="text-project-name">
                  {project.name}
                </h1>
                <p className="text-gray-600 text-lg" data-testid="text-project-description">
                  {project.description || 'No description provided'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={`${getStatusColor(project.status)} px-4 py-2 text-sm font-semibold shadow-sm`} data-testid="badge-project-status">
                  {project.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">DEADLINE</p>
                    <p className="font-bold text-gray-900" data-testid="text-project-deadline">
                      {formatDate(project.deadline?.toString() || null)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">TEAM SIZE</p>
                    <p className="font-bold text-gray-900" data-testid="text-project-team-size">
                      {project._count.assignments} members
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">DOCUMENTS</p>
                    <p className="font-bold text-gray-900" data-testid="text-project-document-count">
                      {project._count.documents} files
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Team Members */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-900 font-semibold">Team Members</span>
                    {user.role === 'project_lead' && (
                      <p className="text-xs text-gray-500 mt-1">Assign developers to your project</p>
                    )}
                  </div>
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
              <CardContent className="p-6">
                {project.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {project.assignments
                      .sort((a, b) => {
                        // Sort project leads first, then developers
                        if (a.user.role === 'project_lead' && b.user.role !== 'project_lead') return -1;
                        if (a.user.role !== 'project_lead' && b.user.role === 'project_lead') return 1;
                        return 0;
                      })
                      .map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
                        data-testid={`assignment-${assignment.user.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                              <AvatarImage 
                                src={assignment.user.profileImageUrl || undefined}
                                alt={assignment.user.firstName || assignment.user.email || 'User'}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                                {(assignment.user.firstName?.[0] || assignment.user.email?.[0] || 'U').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <p className="font-semibold text-gray-900" data-testid={`text-user-name-${assignment.user.id}`}>
                                {assignment.user.firstName && assignment.user.lastName
                                  ? `${assignment.user.firstName} ${assignment.user.lastName}`
                                  : assignment.user.email?.split('@')[0] || 'User'
                                }
                              </p>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                                assignment.user.role === 'project_lead' 
                                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                  : 'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  assignment.user.role === 'project_lead' ? 'bg-blue-500' : 'bg-green-500'
                                }`}></div>
                                {assignment.user.role === 'project_lead' ? 'PROJECT LEAD' : 'DEVELOPER'}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600" data-testid={`text-user-email-${assignment.user.id}`}>
                              {assignment.user.email}
                            </p>
                          </div>
                        </div>
                        {canAssignUsers && assignment.user.id !== user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserMutation.mutate(assignment.user.id)}
                            disabled={removeUserMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9 p-0 transition-all duration-200"
                            data-testid={`button-remove-user-${assignment.user.id}`}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No team members assigned</p>
                    <p className="text-sm text-gray-400 mt-1">Assign team members to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Project Documents */}
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-b border-gray-100 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-gray-900 font-semibold">Documents</span>
                </CardTitle>
                {canUploadDocuments && (
                  <Button
                    size="sm"
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-upload-document"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-6">
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

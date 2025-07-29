import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Plus, Gamepad2, Users, Calendar, FileText, X } from "lucide-react";
import type { ProjectWithDetails } from "@shared/schema";

export default function Projects() {
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

  const { data: projects, isLoading: projectsLoading, error } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
    retry: false,
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest('DELETE', `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
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
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      await apiRequest('PATCH', `/api/projects/${projectId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Project status updated successfully",
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
        description: "Failed to update project status",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return <div>Loading...</div>;
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

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canCreateProjects = user.role === 'admin';
  const canDeleteProjects = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl opacity-10"></div>
            <div className="relative p-6 rounded-2xl backdrop-blur-sm border border-white/20 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="text-projects-title">
                  Game Development Projects
                </h1>
                <p className="text-gray-600 text-lg mt-1">Manage and track your creative projects</p>
              </div>
              {canCreateProjects && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                  data-testid="button-create-project"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create New Project</span>
                </Button>
              )}
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : projects && projects.length > 0 ? (
              projects.map((project) => (
                <Card key={project.id} className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2" data-testid={`project-card-${project.id}`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative">
                        <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Gamepad2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <Badge
                        className={`${getStatusColor(project.status)} shadow-sm font-medium`}
                        data-testid={`badge-project-status-${project.id}`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2" data-testid={`text-project-description-${project.id}`}>
                      {project.description || 'No description provided'}
                    </p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-500 flex items-center font-medium">
                          <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                          Deadline
                        </span>
                        <span className="font-semibold text-gray-900" data-testid={`text-project-deadline-${project.id}`}>
                          {formatDeadline(project.deadline?.toString() || null)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-500 flex items-center font-medium">
                          <Users className="h-4 w-4 mr-2 text-green-500" />
                          Team Size
                        </span>
                        <span className="font-semibold text-gray-900" data-testid={`text-project-team-size-${project.id}`}>
                          {project._count.assignments} members
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-2">
                        <span className="text-gray-500 flex items-center font-medium">
                          <FileText className="h-4 w-4 mr-2 text-purple-500" />
                          Documents
                        </span>
                        <span className="font-semibold text-gray-900">
                          {project._count.documents} files
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex -space-x-2">
                        {project.assignments.slice(0, 3).map((assignment, index) => (
                          <Avatar key={assignment.user.id} className="h-7 w-7 border-2 border-white shadow-sm">
                            <AvatarImage 
                              src={assignment.user.profileImageUrl || undefined} 
                              alt={`${assignment.user.firstName || assignment.user.email}`}
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                              {(assignment.user.firstName?.[0] || assignment.user.email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project._count.assignments > 3 && (
                          <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shadow-sm">
                            <span className="text-xs text-gray-600 font-medium">+{project._count.assignments - 3}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.role === 'admin' && (
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1">
                            {project.status !== 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'active' 
                                })}
                                disabled={updateProjectStatusMutation.isPending}
                                className="text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full h-7 w-7 p-0"
                                title="Mark as Active"
                              >
                                ▶
                              </Button>
                            )}
                            {project.status !== 'on_hold' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'on_hold' 
                                })}
                                disabled={updateProjectStatusMutation.isPending}
                                className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full h-7 w-7 p-0"
                                title="Put On Hold"
                              >
                                ⏸
                              </Button>
                            )}
                            {project.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateProjectStatusMutation.mutate({ 
                                  projectId: project.id, 
                                  status: 'completed' 
                                })}
                                disabled={updateProjectStatusMutation.isPending}
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full h-7 w-7 p-0"
                                title="Mark as Completed"
                              >
                                ✓
                              </Button>
                            )}
                          </div>
                        )}
                        {canDeleteProjects && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                            disabled={deleteProjectMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Link href={`/projects/${project.id}`}>
                      <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-105" data-testid={`button-view-project-${project.id}`}>
                        <span>Open Project</span>
                        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500 mb-4">
                  {canCreateProjects 
                    ? "Get started by creating your first project."
                    : "No projects have been assigned to you yet."
                  }
                </p>
                {canCreateProjects && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    data-testid="button-create-first-project"
                  >
                    Create Project
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateDialog && (
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}

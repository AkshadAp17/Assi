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
import { Plus, Gamepad2, Users, Calendar } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-projects-title">
                Projects
              </h1>
              <p className="text-gray-600">Manage your game development projects</p>
            </div>
            {canCreateProjects && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center space-x-2"
                data-testid="button-create-project"
              >
                <Plus className="h-4 w-4" />
                <span>New Project</span>
              </Button>
            )}
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
                <Card key={project.id} className="project-card" data-testid={`project-card-${project.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                      </div>
                      <Badge
                        className={getStatusColor(project.status)}
                        data-testid={`badge-project-status-${project.id}`}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4" data-testid={`text-project-description-${project.id}`}>
                      {project.description || 'No description provided'}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Deadline
                        </span>
                        <span className="font-medium text-gray-900" data-testid={`text-project-deadline-${project.id}`}>
                          {formatDeadline(project.deadline)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          Team Size
                        </span>
                        <span className="font-medium text-gray-900" data-testid={`text-project-team-size-${project.id}`}>
                          {project._count.assignments} members
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.assignments.slice(0, 3).map((assignment, index) => (
                          <Avatar key={assignment.user.id} className="h-6 w-6 border-2 border-white">
                            <AvatarImage 
                              src={assignment.user.profileImageUrl || undefined} 
                              alt={`${assignment.user.firstName || assignment.user.email}`}
                            />
                            <AvatarFallback className="text-xs">
                              {(assignment.user.firstName?.[0] || assignment.user.email?.[0] || 'U').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project._count.assignments > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project._count.assignments - 3}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-view-project-${project.id}`}>
                            View Details
                          </Button>
                        </Link>
                        {canDeleteProjects && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                            disabled={deleteProjectMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
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

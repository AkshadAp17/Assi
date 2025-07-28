import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Folder, Users, Clock, FileText, Gamepad2 } from "lucide-react";
import type { ProjectWithDetails } from "@shared/schema";

interface DashboardStats {
  activeProjects: number;
  teamMembers: number;
  dueThisWeek: number;
  totalDocuments: number;
}

export default function Dashboard() {
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: recentProjects, isLoading: projectsLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
    retry: false,
    select: (data) => data?.slice(0, 5) || [], // Get only recent 5 projects
  });

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  const getGreeting = () => {
    const name = user.firstName || user.email?.split('@')[0] || 'User';
    return `Welcome back, ${name}`;
  };

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
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
              {getGreeting()}
            </h1>
            <p className="text-gray-600">Here's what's happening with your projects today.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={<Folder className="h-5 w-5 text-blue-600" />}
              title="Active Projects"
              value={statsLoading ? "..." : stats?.activeProjects.toString() || "0"}
              bgColor="bg-blue-100"
              data-testid="stats-active-projects"
            />
            <StatsCard
              icon={<Users className="h-5 w-5 text-green-600" />}
              title="Team Members"
              value={statsLoading ? "..." : stats?.teamMembers.toString() || "0"}
              bgColor="bg-green-100"
              data-testid="stats-team-members"
            />
            <StatsCard
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              title="Due This Week"
              value={statsLoading ? "..." : stats?.dueThisWeek.toString() || "0"}
              bgColor="bg-orange-100"
              data-testid="stats-due-this-week"
            />
            <StatsCard
              icon={<FileText className="h-5 w-5 text-purple-600" />}
              title="Total Documents"
              value={statsLoading ? "..." : stats?.totalDocuments.toString() || "0"}
              bgColor="bg-purple-100"
              data-testid="stats-total-documents"
            />
          </div>

          {/* Recent Projects */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" data-testid="button-view-all-projects">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : recentProjects && recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      data-testid={`project-card-${project.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Gamepad2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900" data-testid={`text-project-name-${project.id}`}>
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-500" data-testid={`text-project-description-${project.id}`}>
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={getStatusColor(project.status)}
                          data-testid={`badge-project-status-${project.id}`}
                        >
                          {project.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1" data-testid={`text-project-deadline-${project.id}`}>
                          Due {formatDeadline(project.deadline)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No projects found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

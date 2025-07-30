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
import { Folder, Users, Clock, FileText, Gamepad2, Menu } from "lucide-react";
import type { ProjectWithDetails, DashboardStats } from "@shared/schema";

// Using DashboardStats from shared schema

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={() => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar && overlay) {
              sidebar.classList.toggle('-translate-x-full');
              overlay.classList.toggle('hidden');
            }
          }}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      <div className="lg:pl-64 pl-0">
        <div className="p-8">
          {/* Enhanced Welcome Header */}
          <div className="mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-200/20 to-indigo-200/20 rounded-full translate-y-4 -translate-x-4"></div>
            <div className="relative p-8 rounded-3xl backdrop-blur-sm border border-white/40 shadow-xl bg-white/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent" data-testid="text-welcome">
                      PixelForge Nexus
                    </h1>
                    <p className="text-xl font-medium text-gray-700 mt-1">{getGreeting()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">System Online</span>
                  </div>
                  <Badge variant="outline" className="bg-white/80 border-blue-200 text-blue-700">
                    {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <p className="text-gray-600 text-lg">Manage your game development projects with ease. Track progress, assign team members, and collaborate effectively.</p>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="stats-active-projects">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <Folder className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600">Active Projects</p>
                      <p className="text-2xl font-bold text-blue-800">{statsLoading ? "..." : stats?.activeProjects?.toString() || "0"}</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-blue-200/50 rounded-full absolute -top-4 -right-4"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="stats-team-members">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">Team Members</p>
                      <p className="text-2xl font-bold text-green-800">{statsLoading ? "..." : (stats?.teamMembers || stats?.totalUsers || 0).toString()}</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-green-200/50 rounded-full absolute -top-4 -right-4"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="stats-due-this-week">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-600">Due This Week</p>
                      <p className="text-2xl font-bold text-orange-800">{statsLoading ? "..." : stats?.dueThisWeek?.toString() || "0"}</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-orange-200/50 rounded-full absolute -top-4 -right-4"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="stats-total-documents">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">Documents</p>
                      <p className="text-2xl font-bold text-purple-800">{statsLoading ? "..." : stats?.totalDocuments?.toString() || "0"}</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-purple-200/50 rounded-full absolute -top-4 -right-4"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Welcome Message Card */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-blue-200 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to GameDev Project Manager</h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Manage your game development projects with ease. Track progress, assign team members, and collaborate effectively to bring your gaming vision to life.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <Link href="/projects">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      View Projects
                    </Button>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/users">
                      <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                        Manage Team
                      </Button>
                    </Link>
                  )}
                  {user.role === 'project_lead' && (
                    <Link href="/projects">
                      <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                        Assign Developers
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Recent Projects */}
          <Card className="mb-8 shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl border-b">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Gamepad2 className="h-6 w-6 text-indigo-600" />
                Recent Projects
              </CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="hover:bg-indigo-100 text-indigo-600 font-medium" data-testid="button-view-all-projects">
                  View all →
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
                  {recentProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-white to-gray-50 p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      data-testid={`project-card-${project.id}`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                              <Gamepad2 className="h-6 w-6" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors" data-testid={`text-project-name-${project.id}`}>
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1" data-testid={`text-project-description-${project.id}`}>
                              {project.description || 'No description available'}
                            </p>
                            <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {project._count.assignments} members
                              </span>
                              <span className="flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                {project._count.documents} docs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${getStatusColor(project.status)} shadow-sm`}
                            data-testid={`badge-project-status-${project.id}`}
                          >
                            {project.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-2 font-medium" data-testid={`text-project-deadline-${project.id}`}>
                            Due {formatDeadline(project.deadline?.toString() || null)}
                          </p>
                        </div>
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

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Trash2,
  Calendar,
  User,
  File,
  Image,
  FileSpreadsheet,
  FileVideo,
  FileArchive
} from "lucide-react";
import type { Document } from "@shared/schema";

interface DocumentListProps {
  projectId: string;
  documents: Document[];
}

export function DocumentList({ projectId, documents }: DocumentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiRequest('DELETE', `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
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

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const downloadUrl = `/api/documents/${documentId}/download`;
      
      // Use window.open instead of creating a link to prevent multiple downloads
      const newWindow = window.open(downloadUrl, '_blank');
      
      // If popup is blocked, fallback to direct navigation
      if (!newWindow) {
        window.location.href = downloadUrl;
      }
      
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    } else if (mimeType.includes('video')) {
      return <FileVideo className="h-5 w-5 text-purple-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <FileArchive className="h-5 w-5 text-orange-500" />;
    } else {
      return <File className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No documents uploaded yet</p>
            <p className="text-sm">
              {user?.role === 'developer' 
                ? "Documents will appear here once they're uploaded by project leads or admins."
                : "Upload your first document to get started with project documentation."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Project Documents ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={doc.id}>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {getFileIcon(doc.mimeType)}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.originalName}
                    </h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Uploaded by {doc.uploadedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.createdAt)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(doc.fileSize)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.id, doc.originalName)}
                    data-testid={`button-download-${doc.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {(user?.role === 'admin' || user?.role === 'project_lead') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                      disabled={deleteDocumentMutation.isPending}
                      data-testid={`button-delete-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
              
              {index < documents.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
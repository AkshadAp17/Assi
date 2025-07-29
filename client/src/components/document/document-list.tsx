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
      <div className="text-center py-12">
        <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-violet-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-purple-500" />
        </div>
        <p className="text-gray-500 font-medium">No documents uploaded</p>
        <p className="text-sm text-gray-400 mt-1">Upload documents to share with your team</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => (
        <div key={doc.id} className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-violet-200 rounded-lg flex items-center justify-center">
                {getFileIcon(doc.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                  {doc.originalName}
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{doc.uploadedBy}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
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
                className="text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-purple-200 hover:border-purple-300 rounded-lg transition-all duration-200 hover:shadow-sm"
                data-testid={`button-download-${doc.id}`}
              >
                <Download className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
              
              {(user?.role === 'admin' || user?.role === 'project_lead') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                  disabled={deleteDocumentMutation.isPending}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300 rounded-lg transition-all duration-200 hover:shadow-sm"
                  data-testid={`button-delete-${doc.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  bgColor?: string;
  className?: string;
  "data-testid"?: string;
}

export function StatsCard({ 
  icon, 
  title, 
  value, 
  bgColor = "bg-gray-100", 
  className,
  "data-testid": testId 
}: StatsCardProps) {
  return (
    <Card className={cn("stats-card", className)} data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", bgColor)}>
              {icon}
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

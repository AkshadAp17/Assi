import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Gamepad2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Gamepad2 className="text-white text-xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">PixelForge Nexus</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6 text-center">
              Manage your game development projects with ease. Track progress, assign team members, and collaborate effectively.
            </p>
            <div className="space-y-3">
              <Link href="/login">
                <Button
                  className="w-full"
                  data-testid="button-login"
                >
                  Sign in
                </Button>
              </Link>
              <p className="text-center text-sm text-gray-600">
                Need an account? Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

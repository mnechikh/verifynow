
"use client";

import * as React from 'react';
import Link from 'next/link'; // Import Link
import { UserManagementForm } from '@/components/user-management-form';
import { UserList } from '@/components/user-list';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react'; // Import AlertTriangle and ArrowLeft

export default function AdminUserManagementPage() {
   const { checkRole, isLoading, currentUser } = useAuth();
   const router = useRouter();
   const [isAuthorized, setIsAuthorized] = React.useState(false);

    React.useEffect(() => {
        if (!isLoading) {
            const authorized = checkRole(['admin']);
            setIsAuthorized(authorized);
            if (!authorized && currentUser) { // Only redirect if loading is done and user exists but isn't admin
                router.push('/'); // Redirect non-admins away
            } else if (!currentUser && !isLoading) { // Redirect if not logged in and not loading
                 router.push('/login');
            }
        }
    }, [checkRole, isLoading, router, currentUser]); // Add currentUser dependency

   // Show loading state or unauthorized message
   if (isLoading || !currentUser) { // Show loading if loading or if currentUser is still null
       return <div className="container mx-auto p-4 md:p-8 text-center">Loading access permissions...</div>;
   }

   if (!isAuthorized) {
      // Render nothing or an unauthorized message briefly before redirect kicks in
      return (
           <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-[60vh]">
                <Card className="w-full max-w-md border-destructive">
                    <CardHeader className="items-center">
                        <AlertTriangle className="h-10 w-10 text-destructive mb-2"/>
                        <CardTitle className="text-destructive">Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                     <CardContent className="text-center text-sm text-muted-foreground">
                        Redirecting...
                    </CardContent>
                </Card>
            </div>
      );
   }


  // Render content only if authorized
  return (
    <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <Link href="/" passHref legacyBehavior>
                    <Button variant="outline" size="icon" aria-label="Back to Home">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-primary">User Management</h1>
            </div>
             {/* Add any other header actions here if needed */}
        </div>


      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Create a new user account and assign a role.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagementForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
           <CardDescription>View and manage current user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserList />
        </CardContent>
      </Card>
    </main>
  );
}

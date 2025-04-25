
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export function UserList() {
  const { users, deleteUser, currentUser } = useAuth();
  const { toast } = useToast();

   const handleDelete = (userId: string, username: string) => {
        const userToDelete = users.find(u => u.id === userId);
        const adminUsers = users.filter(u => u.role === 'admin');

        if (currentUser?.id === userId) {
            toast({ title: "Error", description: "Cannot delete yourself.", variant: "destructive" });
            return;
        }
         if (userToDelete?.role === 'admin' && adminUsers.length <= 1) {
            toast({ title: "Error", description: "Cannot delete the last admin user.", variant: "destructive" });
            return;
         }

        deleteUser(userId);
         toast({ title: "Success", description: `User "${username}" deleted.` });
   };

  return (
    <Table>
      <TableCaption>A list of registered users.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
            <TableRow>
                 <TableCell colSpan={3} className="text-center text-muted-foreground">No users found.</TableCell>
            </TableRow>
        ) : (
             users.map((user) => {
                 const isCurrentUser = currentUser?.id === user.id;
                 const isLastAdmin = user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1;
                 const canDelete = !isCurrentUser && !isLastAdmin;

                 return (
                     <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}{isCurrentUser && <Badge variant="outline" className="ml-2">You</Badge>}</TableCell>
                        <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                {user.role === 'admin' ? <ShieldCheck className="mr-1 h-3 w-3" /> : <UserIcon className="mr-1 h-3 w-3" />}
                                {user.role}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={!canDelete}
                                        title={!canDelete ? (isCurrentUser ? "Cannot delete yourself" : "Cannot delete the last admin") : `Delete user ${user.username}`}
                                    >
                                        <Trash2 className={`h-4 w-4 ${!canDelete ? 'text-muted-foreground' : 'text-destructive'}`} />
                                    </Button>
                                </AlertDialogTrigger>
                                {canDelete && ( // Only render content if deletion is possible
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the user account for "{user.username}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(user.id, user.username)} className="bg-destructive hover:bg-destructive/90">
                                            Delete User
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                )}
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                 );
             })
        )}

      </TableBody>
    </Table>
  );
}

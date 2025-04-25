
"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Role, User } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

const userManagementSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }), // Basic length validation
  role: z.enum(['admin', 'user']), // Ensure role is one of the allowed values
});

type UserManagementFormValues = z.infer<typeof userManagementSchema>;

interface UserManagementFormProps {
 // Add props if needed for editing later
}

export function UserManagementForm({}: UserManagementFormProps) {
  const { addUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<UserManagementFormValues>({
    resolver: zodResolver(userManagementSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "user", // Default new users to 'user' role
    },
  });

  const handleAddUserSubmit = (values: UserManagementFormValues) => {
     const success = addUser({
         username: values.username,
         password: values.password, // STORE PLAIN TEXT - INSECURE
         role: values.role,
     });

    if (success) {
        toast({
            title: "User Added",
            description: `User "${values.username}" created successfully.`,
        });
        form.reset(); // Clear form after successful submission
    } else {
         toast({
            title: "Error",
            description: `Failed to add user "${values.username}". Username might already exist.`,
            variant: "destructive",
         });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleAddUserSubmit)} className="space-y-4 p-4 border rounded-md bg-card shadow-sm">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="New username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Set initial password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4"/> Add User
        </Button>
      </form>
    </Form>
  );
}

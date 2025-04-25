"use client";

import type * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VerificationStep } from '@/types/verification';

const formSchema = z.object({
  name: z.string().min(1, { message: "Step name is required." }),
  description: z.string().optional(),
  criteria: z.string().min(1, { message: "Validation criteria are required." }),
});

type VerificationStepFormValues = z.infer<typeof formSchema>;

interface VerificationStepFormProps {
  onSubmit: (data: Omit<VerificationStep, 'id' | 'status'>) => void;
  initialData?: Partial<VerificationStepFormValues>;
  buttonText?: string;
}

export function VerificationStepForm({
  onSubmit,
  initialData,
  buttonText = "Add Step"
}: VerificationStepFormProps) {
  const form = useForm<VerificationStepFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      criteria: "",
    },
  });

  const handleFormSubmit = (values: VerificationStepFormValues) => {
    onSubmit({
        name: values.name,
        description: values.description || '',
        criteria: values.criteria
    });
    form.reset(); // Reset form after submission
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>{initialData ? 'Edit Verification Step' : 'Add New Verification Step'}</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Step Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Check Python Version" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Describe what this step verifies" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="criteria"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Validation Criteria</FormLabel>
                        <FormControl>
                            <Textarea placeholder="e.g., Python >= 3.8" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {buttonText}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>

  );
}

"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { VerificationStep, StepType, CriteriaVerificationStep, ApiVerificationStep } from '@/types/verification';

// Base schema for common fields
const baseSchema = z.object({
  name: z.string().min(1, { message: "Step name is required." }),
  description: z.string().optional(),
  type: z.enum(['criteria', 'api']),
});

// Schema for 'criteria' type
const criteriaSchema = baseSchema.extend({
  type: z.literal('criteria'),
  criteria: z.string().min(1, { message: "Validation criteria are required." }),
  apiUrl: z.string().optional(), // Keep optional to avoid validation errors when not selected
  apiKeyPath: z.string().optional(),
  expectedValue: z.string().optional(),
});

// Schema for 'api' type
const apiSchema = baseSchema.extend({
  type: z.literal('api'),
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).min(1, { message: "API URL is required." }),
  apiKeyPath: z.string().min(1, { message: "Response Key Path is required." }),
  expectedValue: z.string().min(1, { message: "Expected Value is required." }),
  criteria: z.string().optional(), // Keep optional
});

// Discriminated union schema
const formSchema = z.discriminatedUnion("type", [
  criteriaSchema,
  apiSchema,
]);


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

   const defaultValues: Partial<VerificationStepFormValues> = initialData ? {
        ...initialData,
        type: initialData.type || 'criteria', // Default to criteria if not set
    } : {
        name: "",
        description: "",
        type: 'criteria', // Default to criteria for new steps
        criteria: "",
        apiUrl: "",
        apiKeyPath: "",
        expectedValue: "",
    };


  const form = useForm<VerificationStepFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const selectedType = form.watch("type");

  // Reset fields when type changes
  useEffect(() => {
    if (selectedType === 'criteria') {
      form.resetField("apiUrl");
      form.resetField("apiKeyPath");
      form.resetField("expectedValue");
    } else if (selectedType === 'api') {
      form.resetField("criteria");
    }
  }, [selectedType, form]);


  const handleFormSubmit = (values: VerificationStepFormValues) => {
     let submitData: Omit<CriteriaVerificationStep | ApiVerificationStep, 'id' | 'status'>;

    if (values.type === 'criteria') {
      submitData = {
        type: 'criteria',
        name: values.name,
        description: values.description || '',
        criteria: values.criteria,
      };
    } else { // type === 'api'
      submitData = {
        type: 'api',
        name: values.name,
        description: values.description || '',
        apiUrl: values.apiUrl,
        apiKeyPath: values.apiKeyPath,
        expectedValue: values.expectedValue,
      };
    }

    onSubmit(submitData);
    form.reset(); // Reset form to default values after submission
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>{initialData ? 'Edit Verification Step' : 'Add New Verification Step'}</CardTitle>
             <CardDescription>Define the details for this verification step.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                                <Textarea placeholder="Describe what this step verifies" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                     <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Verification Type</FormLabel>
                             <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                                >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="criteria" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Text Criteria</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="api" />
                                    </FormControl>
                                    <FormLabel className="font-normal">API Check</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                     />


                    {/* Conditional Fields */}
                    {selectedType === 'criteria' && (
                        <FormField
                            control={form.control}
                            name="criteria"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Validation Criteria</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Python >= 3.8 OR Expected output text" {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {selectedType === 'api' && (
                        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                             <FormField
                                control={form.control}
                                name="apiUrl"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>API URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://api.example.com/health" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="apiKeyPath"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Response Key Path</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., data.status or user[0].active" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                     <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="expectedValue"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Expected Value</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 'OK' or 'true' or '123'" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                     <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}


                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {buttonText}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>

  );
}

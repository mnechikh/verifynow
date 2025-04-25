
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"; // Added FormDescription
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
  apiToken: z.string().optional(), // Keep optional
});

// Schema for 'api' type
const apiSchema = baseSchema.extend({
  type: z.literal('api'),
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).min(1, { message: "API URL is required." }),
  apiKeyPath: z.string().min(1, { message: "Response Key Path is required." }),
  expectedValue: z.string().min(1, { message: "Expected Value is required." }),
  apiToken: z.string().optional(), // Optional API token
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
  disabled?: boolean; // Added disabled prop
}

export function VerificationStepForm({
  onSubmit,
  initialData,
  buttonText = "Add Step",
  disabled = false, // Default to not disabled
}: VerificationStepFormProps) {

   const defaultValues: Partial<VerificationStepFormValues> = initialData ? {
        ...initialData,
        type: initialData.type || 'criteria', // Default to criteria if not set
        apiToken: initialData.apiToken || '', // Include apiToken
    } : {
        name: "",
        description: "",
        type: 'criteria', // Default to criteria for new steps
        criteria: "",
        apiUrl: "",
        apiKeyPath: "",
        expectedValue: "",
        apiToken: "", // Default empty token
    };


  const form = useForm<VerificationStepFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    disabled: disabled, // Pass disabled state to the form
  });

  const selectedType = form.watch("type");

  // Reset fields when type changes, but preserve existing values if editing
    useEffect(() => {
        if (!initialData && !disabled) { // Only reset fully if it's a *new* step form and not disabled
            if (selectedType === 'criteria') {
                form.resetField("apiUrl");
                form.resetField("apiKeyPath");
                form.resetField("expectedValue");
                form.resetField("apiToken");
            } else if (selectedType === 'api') {
                form.resetField("criteria");
            }
        }
    }, [selectedType, form, initialData, disabled]);


  const handleFormSubmit = (values: VerificationStepFormValues) => {
     if (disabled) return; // Prevent submission if disabled

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
        apiToken: values.apiToken || undefined, // Submit token or undefined if empty
      };
    }

    onSubmit(submitData);
    // Reset only if it's not an edit form (i.e., initialData was not provided)
    if (!initialData) {
        form.reset( { // Reset form to default values after submission, explicitly setting type back if needed
            name: "",
            description: "",
            type: 'criteria', // Reset type to default
            criteria: "",
            apiUrl: "",
            apiKeyPath: "",
            expectedValue: "",
            apiToken: "",
        });
    }
  };

  return (
    // Use a Card only if it's not an editing form, otherwise just the form fields
     <Form {...form}>
       <fieldset disabled={disabled} className="space-y-4 border p-4 rounded-md bg-muted/20 disabled:opacity-70 disabled:cursor-not-allowed">
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Step Name</FormLabel>
                      <FormControl>
                          <Input placeholder="e.g., Check API Health" {...field} />
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
                          <FormDescription>
                              Text or criteria expected from a command output or log file.
                          </FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              )}

              {selectedType === 'api' && (
                  <div className="space-y-4 p-4 border rounded-md bg-card shadow-sm">
                      <FormField
                          control={form.control}
                          name="apiUrl"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>API URL</FormLabel>
                              <FormControl>
                                  <Input placeholder="https://api.example.com/health" {...field} value={field.value ?? ''}/>
                              </FormControl>
                              <FormDescription>
                                  The full URL of the API endpoint to check.
                              </FormDescription>
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
                              <FormDescription>
                                  Dot notation path to the value in the JSON response (e.g., `data.items[0].name`).
                              </FormDescription>
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
                                <FormDescription>
                                  The exact string value expected at the specified key path.
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={form.control}
                          name="apiToken"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>API Token (Optional)</FormLabel>
                              <FormControl>
                                  <Input type="password" placeholder="Enter API token (e.g., Bearer Token)" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormDescription>
                                  Authentication token if required by the API (will be sent in Authorization header). Leave blank if none.
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>
              )}


              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={disabled}>
                  {buttonText}
              </Button>
          </form>
       </fieldset>
    </Form>

  );
}


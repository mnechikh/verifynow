
"use client";

import type * as React from 'react';
import { useEffect } from 'react'; // Keep useEffect for potential future use or initial loading logic if needed, but not for resetting fields on type change
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
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
  // Remove API fields from criteria schema - they shouldn't exist here
});

// Schema for 'api' type
const apiSchema = baseSchema.extend({
  type: z.literal('api'),
  apiUrl: z.string().url({ message: "Please enter a valid URL." }).min(1, { message: "API URL is required." }),
  apiKeyPath: z.string().min(1, { message: "Response Key Path is required." }),
  expectedValue: z.string().min(1, { message: "Expected Value is required." }),
  apiToken: z.string().optional(), // Optional API token
  // Remove criteria field from API schema
});

// Discriminated union schema using refine for better conditional validation
// This ensures that fields only relevant to one type are not required by the other.
const formSchema = z.union([criteriaSchema, apiSchema]);

type VerificationStepFormValues = z.infer<typeof formSchema>;

interface VerificationStepFormProps {
  onSubmit: (data: Omit<VerificationStep, 'id' | 'status'>) => void;
  initialData?: Partial<VerificationStepFormValues>;
  buttonText?: string;
  disabled?: boolean; // Added disabled prop
}

// Define default values outside the component
const baseDefaultValues: Partial<VerificationStepFormValues> = {
    name: "",
    description: "",
    type: 'criteria', // Default to criteria for new steps
    criteria: "",
    apiUrl: "",
    apiKeyPath: "",
    expectedValue: "",
    apiToken: "",
};


export function VerificationStepForm({
  onSubmit,
  initialData,
  buttonText = "Add Step",
  disabled = false,
}: VerificationStepFormProps) {

   // Use initialData if provided, otherwise use base defaults
   const defaultValuesToSet = initialData
     ? { ...baseDefaultValues, ...initialData }
     : baseDefaultValues;


   const form = useForm<VerificationStepFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValuesToSet,
    disabled: disabled,
    // Remove resetOptions, let RHF handle resets normally
   });

  // Watch the type field to control conditional rendering
  const selectedType = form.watch("type");

   // Removed the problematic useEffect hook that called resetField

   const handleFormSubmit = (values: VerificationStepFormValues) => {
     if (disabled) return;

     // Construct the submit data based on the actual type from the form values
     let submitData: Omit<CriteriaVerificationStep | ApiVerificationStep, 'id' | 'status'>;

     if (values.type === 'criteria') {
       // Ensure only criteria fields are included
       submitData = {
         type: 'criteria',
         name: values.name,
         description: values.description || '',
         criteria: values.criteria!, // Assert non-null as it's required by the schema for this type
       };
     } else { // type === 'api'
       // Ensure only API fields are included
       submitData = {
         type: 'api',
         name: values.name,
         description: values.description || '',
         apiUrl: values.apiUrl!, // Assert non-null
         apiKeyPath: values.apiKeyPath!, // Assert non-null
         expectedValue: values.expectedValue!, // Assert non-null
         apiToken: values.apiToken || undefined, // Submit token or undefined if empty
       };
     }

    onSubmit(submitData);

    // Reset form after submission *only* if we are adding a new step (no initialData)
    if (!initialData) {
        form.reset(baseDefaultValues); // Reset to base defaults for a fresh "add" form
    }
  };


  return (
     <Form {...form}>
       <fieldset disabled={disabled} className="space-y-4 border p-4 rounded-md bg-muted/20 disabled:opacity-70 disabled:cursor-not-allowed">
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Common Fields */}
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

              {/* Type Selector */}
              <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                      <FormItem className="space-y-3">
                      <FormLabel>Verification Type</FormLabel>
                      <FormControl>
                          {/* Use Controller directly for RadioGroup if needed for more control, or keep as is */}
                          <RadioGroup
                            onValueChange={field.onChange} // Directly use RHF's onChange
                            value={field.value}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                            disabled={field.disabled}
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


              {/* --- Conditional Fields --- */}

              {/* Criteria Specific Field */}
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

              {/* API Specific Fields */}
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
              {/* --- End Conditional Fields --- */}


              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={disabled}>
                  {buttonText}
              </Button>
          </form>
       </fieldset>
    </Form>

  );
}

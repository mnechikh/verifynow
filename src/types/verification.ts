
import { z } from 'zod';

export type VerificationStatus = 'pending' | 'running' | 'success' | 'failure' | 'warning';
export const VerificationStatusSchema = z.enum(['pending', 'running', 'success', 'failure', 'warning']);

export type StepType = 'criteria' | 'api';
export const StepTypeSchema = z.enum(['criteria', 'api']);

// Base interface for common properties
const VerificationStepBaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  status: VerificationStatusSchema,
  resultMessage: z.string().optional(),
});

// Interface for steps validated by simple text criteria
export const CriteriaVerificationStepSchema = VerificationStepBaseSchema.extend({
  type: z.literal('criteria'),
  criteria: z.string().min(1),
});
export type CriteriaVerificationStep = z.infer<typeof CriteriaVerificationStepSchema>;


// Interface for steps validated by an API call
export const ApiVerificationStepSchema = VerificationStepBaseSchema.extend({
  type: z.literal('api'),
  apiUrl: z.string().url().min(1),
  apiKeyPath: z.string().min(1), // e.g., "data.status" or "user.id"
  expectedValue: z.string().min(1), // Value to check against the key path
  apiToken: z.string().optional(), // Optional authentication token (e.g., Bearer token)
});
export type ApiVerificationStep = z.infer<typeof ApiVerificationStepSchema>;


// Union type for any verification step
export const VerificationStepSchema = z.union([
    CriteriaVerificationStepSchema,
    ApiVerificationStepSchema,
]);
export type VerificationStep = z.infer<typeof VerificationStepSchema>;


// Represents a named set of verification steps
export const VerificationSetSchema = z.object({
    id: z.string(), // Unique ID for the configuration set
    name: z.string().min(1), // User-friendly name for the set
    steps: z.array(VerificationStepSchema),
});
export type VerificationSet = z.infer<typeof VerificationSetSchema>;

// Schema for an array of verification sets (for import)
export const VerificationSetArraySchema = z.array(VerificationSetSchema);


// Represents a single logged execution of a verification set
export const ExecutionLogEntrySchema = z.object({
    id: z.string(), // Unique ID for this log entry
    configSetId: z.string(), // ID of the configuration set that was run
    configSetName: z.string(), // Name of the configuration set at the time of execution
    startTime: z.number(), // Timestamp (Date.now()) when the execution started
    endTime: z.number(), // Timestamp (Date.now()) when the execution finished
    overallStatus: VerificationStatusSchema, // Overall result (success, failure, warning)
    steps: z.array(z.object({ // Store relevant details for each step in the log
        id: z.string(),
        name: z.string(),
        type: StepTypeSchema,
        status: VerificationStatusSchema,
        resultMessage: z.string().optional(),
    })),
});
export type ExecutionLogEntry = z.infer<typeof ExecutionLogEntrySchema>;



export type VerificationStatus = 'pending' | 'running' | 'success' | 'failure' | 'warning';

export type StepType = 'criteria' | 'api';

// Base interface for common properties
interface VerificationStepBase {
  id: string;
  name: string;
  description: string;
  status: VerificationStatus;
  resultMessage?: string; // Optional message detailing success/failure/warning
}

// Interface for steps validated by simple text criteria
export interface CriteriaVerificationStep extends VerificationStepBase {
  type: 'criteria';
  criteria: string;
}

// Interface for steps validated by an API call
export interface ApiVerificationStep extends VerificationStepBase {
  type: 'api';
  apiUrl: string;
  apiKeyPath: string; // e.g., "data.status" or "user.id"
  expectedValue: string; // Value to check against the key path
  apiToken?: string; // Optional authentication token (e.g., Bearer token)
}

// Union type for any verification step
export type VerificationStep = CriteriaVerificationStep | ApiVerificationStep;

// Represents a named set of verification steps
export interface VerificationSet {
    id: string; // Unique ID for the configuration set
    name: string; // User-friendly name for the set
    steps: VerificationStep[];
}

// Represents a single logged execution of a verification set
export interface ExecutionLogEntry {
    id: string; // Unique ID for this log entry
    configSetId: string; // ID of the configuration set that was run
    configSetName: string; // Name of the configuration set at the time of execution
    startTime: number; // Timestamp (Date.now()) when the execution started
    endTime: number; // Timestamp (Date.now()) when the execution finished
    overallStatus: VerificationStatus; // Overall result (success, failure, warning)
    steps: Array<{ // Store relevant details for each step in the log
        id: string;
        name: string;
        type: StepType;
        status: VerificationStatus;
        resultMessage?: string;
    }>;
}

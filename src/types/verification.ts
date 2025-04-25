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

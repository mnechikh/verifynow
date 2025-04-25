export type VerificationStatus = 'pending' | 'running' | 'success' | 'failure' | 'warning';

export interface VerificationStep {
  id: string;
  name: string;
  description: string;
  criteria: string; // Simple text criteria for now
  status: VerificationStatus;
  resultMessage?: string; // Optional message detailing success/failure/warning
}

"use client";

import type * as React from 'react';
import type { VerificationStep, VerificationStatus } from '@/types/verification';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, CircleDot } from 'lucide-react';
import { cn } from "@/lib/utils";

interface VerificationExecutionProps {
  steps: VerificationStep[];
  isRunning: boolean;
}

const StatusIcon: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <CircleDot className="h-5 w-5 text-muted-foreground" aria-label="Pending" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-accent animate-spin" aria-label="Running" />;
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Success" />;
    case 'failure':
      return <XCircle className="h-5 w-5 text-destructive" aria-label="Failure" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" aria-label="Warning" />;
    default:
      return null;
  }
};

const statusTextClass: Record<VerificationStatus, string> = {
    pending: 'text-muted-foreground',
    running: 'text-accent',
    success: 'text-green-600',
    failure: 'text-destructive',
    warning: 'text-yellow-500',
};

const statusBgClass: Record<VerificationStatus, string> = {
    pending: 'bg-muted/20',
    running: 'bg-accent/10 animate-pulse',
    success: 'bg-green-100 dark:bg-green-900/30',
    failure: 'bg-red-100 dark:bg-red-900/30',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
};

export function VerificationExecution({ steps, isRunning }: VerificationExecutionProps) {
  const completedSteps = steps.filter(step => step.status === 'success' || step.status === 'failure' || step.status === 'warning').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Status</CardTitle>
        <CardDescription>Real-time status of the installation verification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className='space-y-2'>
            <Progress value={progress} className="w-full [&>div]:bg-accent" aria-label={`Verification progress: ${progress.toFixed(0)}%`} />
            <p className="text-sm text-muted-foreground">{`${completedSteps} of ${steps.length} steps completed.`}</p>
        </div>
        {steps.length > 0 ? (
          <ul className="space-y-3">
            {steps.map((step) => (
              <li key={step.id} className={cn(
                "border p-4 rounded-md flex items-center space-x-4 transition-colors duration-300",
                 statusBgClass[step.status]
                 )}>
                <StatusIcon status={step.status} />
                <div className="flex-grow">
                  <p className="font-medium">{step.name}</p>
                   <p className={cn("text-sm capitalize", statusTextClass[step.status])}>
                       {step.status}
                       {step.resultMessage && `: ${step.resultMessage}`}
                    </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center py-4">No verification steps configured yet.</p>
        )}

        {isRunning && !steps.some(s => s.status === 'running') && steps.length > 0 && (
            <p className="text-center text-muted-foreground">Waiting to start...</p>
        )}

      </CardContent>
    </Card>
  );
}

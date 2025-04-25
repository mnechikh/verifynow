"use client";

import type * as React from 'react';
import type { VerificationStep } from '@/types/verification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface VerificationReportProps {
  steps: VerificationStep[];
}

export function VerificationReport({ steps }: VerificationReportProps) {
  const totalSteps = steps.length;
  const successfulSteps = steps.filter(step => step.status === 'success').length;
  const failedSteps = steps.filter(step => step.status === 'failure').length;
  const warningSteps = steps.filter(step => step.status === 'warning').length;

  const isOverallSuccess = failedSteps === 0 && totalSteps > 0;
  const hasWarnings = warningSteps > 0;

  const getOverallStatus = () => {
      if (totalSteps === 0) return { message: "No steps were run.", Icon: AlertTriangle, color: "text-muted-foreground" };
      if (failedSteps > 0) return { message: "Installation verification failed.", Icon: XCircle, color: "text-destructive" };
      if (warningSteps > 0) return { message: "Installation verified with warnings.", Icon: AlertTriangle, color: "text-yellow-500" };
      return { message: "Installation verified successfully!", Icon: CheckCircle2, color: "text-green-600" };
  }

  const { message, Icon, color } = getOverallStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Installation Report</CardTitle>
        <CardDescription>Summary of the verification process.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center space-x-2 p-4 rounded-md ${isOverallSuccess ? (hasWarnings ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30') : 'bg-red-100 dark:bg-red-900/30'}`}>
          <Icon className={`h-6 w-6 ${color}`} />
          <p className={`font-semibold ${color}`}>{message}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-md bg-card">
            <p className="text-sm text-muted-foreground">Total Steps</p>
            <p className="text-2xl font-bold">{totalSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successfulSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card">
            <p className="text-sm text-muted-foreground">Failures</p>
            <p className="text-2xl font-bold text-destructive">{failedSteps}</p>
          </div>
           <div className="p-3 border rounded-md bg-card sm:col-start-2">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500">{warningSteps}</p>
          </div>
        </div>

        {(failedSteps > 0 || warningSteps > 0) && (
          <div>
            <h4 className="font-semibold mb-2">Details:</h4>
            <ul className="space-y-2 text-sm">
              {steps.filter(step => step.status === 'failure' || step.status === 'warning').map(step => (
                <li key={step.id} className={`flex items-start space-x-2 ${step.status === 'failure' ? 'text-destructive' : 'text-yellow-500'}`}>
                  {step.status === 'failure' ? <XCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>
                    <span className="font-medium">{step.name}:</span> {step.resultMessage || (step.status === 'failure' ? 'Step failed' : 'Step produced a warning')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

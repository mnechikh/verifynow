"use client";

import type * as React from 'react';
import type { VerificationStep } from '@/types/verification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, MessageSquareWarning, Info } from 'lucide-react'; // Added Info icon
import { Separator } from '@/components/ui/separator'; // Import Separator
import { cn } from '@/lib/utils'; // Import cn utility

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
      if (totalSteps === 0) return { message: "No steps were run.", Icon: AlertTriangle, color: "text-muted-foreground", bgColor: "bg-muted/30" };
      if (failedSteps > 0) return { message: "Installation verification failed.", Icon: XCircle, color: "text-destructive", bgColor: "bg-red-100 dark:bg-red-900/30" };
      if (warningSteps > 0) return { message: "Installation verified with warnings.", Icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" };
      return { message: "Installation verified successfully!", Icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" };
  }

  const { message, Icon, color, bgColor } = getOverallStatus();

  const stepsWithMessages = steps.filter(step => step.resultMessage && (step.status === 'failure' || step.status === 'warning'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Installation Report</CardTitle>
        <CardDescription>Summary of the verification process results.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6"> {/* Increased spacing */}
        {/* Overall Status Banner */}
        <div className={cn("flex items-center space-x-3 p-4 rounded-md", bgColor)}> {/* Use cn and adjusted spacing */}
          <Icon className={`h-6 w-6 ${color} shrink-0`} /> {/* Added shrink-0 */}
          <p className={`font-semibold ${color}`}>{message}</p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-md bg-card shadow-sm"> {/* Added shadow */}
            <p className="text-sm text-muted-foreground">Total Steps</p>
            <p className="text-2xl font-bold">{totalSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card shadow-sm"> {/* Added shadow */}
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successfulSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card shadow-sm"> {/* Added shadow */}
            <p className="text-sm text-muted-foreground">Failures</p>
            <p className="text-2xl font-bold text-destructive">{failedSteps}</p>
          </div>
           <div className="p-3 border rounded-md bg-card shadow-sm sm:col-start-2"> {/* Added shadow */}
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500">{warningSteps}</p>
          </div>
        </div>

        {/* Detailed Logs for Failures and Warnings */}
        {stepsWithMessages.length > 0 && (
          <div className="space-y-4">
            <Separator /> {/* Add separator */}
            <h4 className="font-semibold text-lg flex items-center"> {/* Adjusted heading */}
              <MessageSquareWarning className="h-5 w-5 mr-2 text-muted-foreground"/> {/* Added icon */}
              Detailed Logs
            </h4>
            <Card className="bg-muted/20"> {/* Wrap logs in a card for better visual separation */}
              <CardContent className="p-4 space-y-3">
                {stepsWithMessages.map(step => (
                  <div key={step.id} className={cn(
                      "flex items-start space-x-3 p-3 rounded-md border",
                      step.status === 'failure' ? 'border-destructive/50 bg-red-50 dark:bg-red-900/20 text-destructive' : 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                  )}>
                    {step.status === 'failure' ?
                      <XCircle className="h-5 w-5 mt-0.5 shrink-0 text-destructive" /> :
                      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-yellow-500" />
                    }
                    <div className="flex-grow text-sm">
                      <p className="font-medium mb-1">{step.name} ({step.status})</p>
                      <p className={cn(step.status === 'failure' ? 'text-destructive/90' : 'text-yellow-700 dark:text-yellow-300')}>
                        {step.resultMessage || 'No specific message provided.'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

         {/* Message if no issues */}
        {totalSteps > 0 && failedSteps === 0 && warningSteps === 0 && (
           <div className="flex items-center space-x-2 text-sm text-green-600 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
             <Info className="h-4 w-4 shrink-0"/>
             <span>All verification steps completed successfully.</span>
           </div>
        )}

         {/* Message if no steps were run */}
         {totalSteps === 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground p-3 rounded-md bg-muted/30 border">
                <Info className="h-4 w-4 shrink-0"/>
                <span>No verification steps were configured or executed.</span>
            </div>
         )}

      </CardContent>
    </Card>
  );
}

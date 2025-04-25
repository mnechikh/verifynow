"use client";

import type * as React from 'react';
import type { VerificationStep } from '@/types/verification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, MessageSquareMore, Info, CircleDot } from 'lucide-react'; // Changed icon for logs
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Import Accordion components

interface VerificationReportProps {
  steps: VerificationStep[];
}

export function VerificationReport({ steps }: VerificationReportProps) {
  const totalSteps = steps.length;
  const successfulSteps = steps.filter(step => step.status === 'success').length;
  const failedSteps = steps.filter(step => step.status === 'failure').length;
  const warningSteps = steps.filter(step => step.status === 'warning').length;

  const getOverallStatus = () => {
      if (totalSteps === 0) return { message: "No steps were run.", Icon: Info, color: "text-muted-foreground", bgColor: "bg-muted/30" };
      if (failedSteps > 0) return { message: "Installation verification failed.", Icon: XCircle, color: "text-destructive", bgColor: "bg-red-100 dark:bg-red-900/30" };
      if (warningSteps > 0) return { message: "Installation verified with warnings.", Icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" };
      return { message: "Installation verified successfully!", Icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" };
  }

  const { message, Icon, color, bgColor } = getOverallStatus();

  const stepsWithMessages = steps.filter(step => step.resultMessage && step.status !== 'pending'); // Show logs for all completed steps

  // Function to determine icon and color based on status
  const getStatusDetails = (status: VerificationStep['status']) => {
    switch (status) {
      case 'success':
        return { IconComp: CheckCircle2, colorClass: 'text-green-600', bgClass: 'bg-green-50 dark:bg-green-900/20', borderClass: 'border-green-200 dark:border-green-700' };
      case 'failure':
        return { IconComp: XCircle, colorClass: 'text-destructive', bgClass: 'bg-red-50 dark:bg-red-900/20', borderClass: 'border-destructive/50' };
      case 'warning':
        return { IconComp: AlertTriangle, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-50 dark:bg-yellow-900/20', borderClass: 'border-yellow-500/50' };
      default: // pending or running (shouldn't appear here based on filter)
        return { IconComp: CircleDot, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/20', borderClass: 'border-border' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Installation Report</CardTitle>
        <CardDescription>Summary and detailed logs of the verification process.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Status Banner */}
        <div className={cn("flex items-center space-x-3 p-4 rounded-md", bgColor)}>
          <Icon className={`h-6 w-6 ${color} shrink-0`} />
          <p className={`font-semibold ${color}`}>{message}</p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-md bg-card shadow-sm">
            <p className="text-sm text-muted-foreground">Total Steps</p>
            <p className="text-2xl font-bold">{totalSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card shadow-sm">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successfulSteps}</p>
          </div>
          <div className="p-3 border rounded-md bg-card shadow-sm">
            <p className="text-sm text-muted-foreground">Failures</p>
            <p className="text-2xl font-bold text-destructive">{failedSteps}</p>
          </div>
           <div className="p-3 border rounded-md bg-card shadow-sm sm:col-start-2">
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-2xl font-bold text-yellow-500">{warningSteps}</p>
          </div>
        </div>

        {/* Detailed Logs for All Completed Steps */}
        {stepsWithMessages.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-semibold text-lg flex items-center">
              <MessageSquareMore className="h-5 w-5 mr-2 text-muted-foreground"/>
              Detailed Logs
            </h4>
             <Accordion type="multiple" className="w-full space-y-2">
                {stepsWithMessages.map(step => {
                   const { IconComp, colorClass, bgClass, borderClass } = getStatusDetails(step.status);
                   return (
                      <AccordionItem key={step.id} value={step.id} className={cn("border rounded-md overflow-hidden", borderClass)}>
                          <AccordionTrigger className={cn("flex items-center space-x-3 p-3 hover:no-underline", bgClass)}>
                               <IconComp className={cn("h-5 w-5 shrink-0", colorClass)} />
                               <span className="flex-grow text-left font-medium">{step.name}</span>
                               <span className={cn("text-sm capitalize font-semibold px-2 py-0.5 rounded", colorClass )}>
                                    {step.status}
                               </span>
                          </AccordionTrigger>
                          <AccordionContent className="p-4 text-sm bg-card border-t">
                             <pre className="whitespace-pre-wrap break-words text-muted-foreground font-mono text-xs bg-muted/30 p-3 rounded-md">
                                {step.resultMessage || 'No specific message provided.'}
                             </pre>
                          </AccordionContent>
                      </AccordionItem>
                   );
                })}
            </Accordion>
          </div>
        )}

         {/* Message if no issues */}
        {totalSteps > 0 && failedSteps === 0 && warningSteps === 0 && steps.every(s => s.status === 'success') && (
           <div className="flex items-center space-x-2 text-sm text-green-600 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
             <Info className="h-4 w-4 shrink-0"/>
             <span>All verification steps completed successfully. See logs above for details.</span>
           </div>
        )}

         {/* Message if no steps were completed */}
         {totalSteps > 0 && steps.every(s => s.status === 'pending' || s.status === 'running') && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground p-3 rounded-md bg-muted/30 border">
                <Info className="h-4 w-4 shrink-0"/>
                <span>Verification has not completed yet.</span>
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


"use client";

import type * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { ExecutionLogEntry } from '@/types/verification';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const getStatusDetails = (status: ExecutionLogEntry['overallStatus']) => {
    switch (status) {
        case 'success':
            return { IconComp: CheckCircle2, colorClass: 'text-green-600', bgClass: 'bg-green-100 dark:bg-green-900/30', label: 'Success' };
        case 'failure':
            return { IconComp: XCircle, colorClass: 'text-destructive', bgClass: 'bg-red-100 dark:bg-red-900/30', label: 'Failure' };
        case 'warning':
            return { IconComp: AlertTriangle, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Warning' };
        default: // pending
            return { IconComp: Clock, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/30', label: 'Pending/Incomplete' };
    }
};

const getStepStatusDetails = (status: ExecutionLogEntry['steps'][0]['status']) => {
     switch (status) {
      case 'success':
        return { IconComp: CheckCircle2, colorClass: 'text-green-600', label: 'Success' };
      case 'failure':
        return { IconComp: XCircle, colorClass: 'text-destructive', label: 'Failure' };
      case 'warning':
        return { IconComp: AlertTriangle, colorClass: 'text-yellow-500', label: 'Warning' };
      default: // pending or running
        return { IconComp: Clock, colorClass: 'text-muted-foreground', label: status };
    }
};

export default function ExecutionHistoryPage() {
    const [executionHistory, setExecutionHistory] = useLocalStorage<ExecutionLogEntry[]>('verificationExecutionHistory', []);
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]);
    const { toast } = useToast();

    const clearHistory = () => {
        setExecutionHistory([]);
        toast({ title: "Success", description: "Execution history cleared." });
    };

    const deleteEntry = (id: string) => {
        setExecutionHistory(prev => prev.filter(entry => entry.id !== id));
         toast({ title: "Success", description: "Log entry deleted." });
    };


    return (
        <main className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                     <Link href="/" passHref legacyBehavior>
                         <Button variant="outline" size="icon" className="mr-2">
                            <ArrowLeft className="h-4 w-4" />
                         </Button>
                     </Link>
                     <h1 className="text-3xl font-bold text-primary">Execution History</h1>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={executionHistory.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4" /> Clear All History
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all execution log entries.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">
                            Clear History
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Past Executions</CardTitle>
                    <CardDescription>Review the results of previous verification runs.</CardDescription>
                </CardHeader>
                <CardContent>
                    {executionHistory.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">No execution history recorded yet.</p>
                    ) : (
                        <Accordion type="multiple" value={openAccordionItems} onValueChange={setOpenAccordionItems} className="w-full space-y-3">
                            {executionHistory.sort((a, b) => b.startTime - a.startTime).map((log) => { // Sort by startTime descending
                                const { IconComp, colorClass, bgClass, label } = getStatusDetails(log.overallStatus);
                                const duration = log.endTime ? ((log.endTime - log.startTime) / 1000).toFixed(1) : '-';

                                return (
                                    <AccordionItem key={log.id} value={log.id} className="border rounded-md overflow-hidden shadow-sm">
                                        <div className="flex items-center pr-2"> {/* Wrapper for trigger and delete button */}
                                            <AccordionTrigger className={cn("flex-grow flex items-center justify-between p-4 hover:no-underline", bgClass)}>
                                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                                    <IconComp className={cn("h-6 w-6 shrink-0", colorClass)} />
                                                    <div className="flex-grow text-left space-y-0.5 overflow-hidden">
                                                        <p className="font-semibold truncate" title={log.configSetName}>{log.configSetName}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(log.startTime), "PPp")} ({duration}s)
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant={log.overallStatus === 'success' ? 'default' : log.overallStatus === 'failure' ? 'destructive' : 'secondary'}
                                                       className={cn("ml-auto mr-2 capitalize shrink-0",
                                                          log.overallStatus === 'success' && 'bg-green-600 hover:bg-green-700 text-white',
                                                          log.overallStatus === 'warning' && 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                                       )}>
                                                    {label}
                                                </Badge>
                                                {/* Chevron replaced by default AccordionTrigger icon */}
                                            </AccordionTrigger>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                      <Button variant="ghost" size="icon" className="ml-1 shrink-0">
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                      </Button>
                                                </AlertDialogTrigger>
                                                 <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Log Entry?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete the log entry for "{log.configSetName}" executed on {format(new Date(log.startTime), "PPp")}? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => deleteEntry(log.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Delete Entry
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <AccordionContent className="p-4 border-t bg-card">
                                            <h4 className="font-medium mb-3 text-base">Step Details:</h4>
                                            {log.steps.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {log.steps.map((step) => {
                                                        const { IconComp: StepIcon, colorClass: stepColor, label: stepLabel } = getStepStatusDetails(step.status);
                                                        return (
                                                            <li key={step.id} className="border p-3 rounded-md bg-muted/20 flex flex-col sm:flex-row sm:items-start sm:space-x-3">
                                                                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                                                                    <StepIcon className={cn("h-4 w-4 shrink-0", stepColor)} />
                                                                    <span className="font-medium text-sm flex-shrink-0">{step.name}</span>
                                                                     <Badge variant="outline" size="sm" className="capitalize shrink-0">{stepLabel}</Badge>
                                                                </div>
                                                                {step.resultMessage && (
                                                                     <p className="text-xs text-muted-foreground pl-6 sm:pl-0 sm:flex-grow break-words">
                                                                         {step.resultMessage}
                                                                     </p>
                                                                )}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No steps were recorded for this execution.</p>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}

    
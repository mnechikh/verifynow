"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { VerificationConfig } from '@/components/verification-config';
import { VerificationExecution } from '@/components/verification-execution';
import { VerificationReport } from '@/components/verification-report';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; // Added import
import type { VerificationStep, VerificationStatus } from '@/types/verification';
import { Play, Settings, FileText, RotateCcw, Loader2 } from 'lucide-react'; // Ensure Loader2 is imported

// Mock function to simulate step execution
const simulateStepExecution = (step: VerificationStep): Promise<Partial<VerificationStep>> => {
  return new Promise(resolve => {
    const duration = Math.random() * 1500 + 500; // Simulate 0.5 to 2 seconds execution time
    setTimeout(() => {
      const randomOutcome = Math.random();
      let status: VerificationStatus = 'success';
      let resultMessage = 'Verified successfully.';

      // Simulate failures and warnings based on criteria (simple simulation)
      if (step.criteria.toLowerCase().includes('fail') || randomOutcome < 0.15) {
          status = 'failure';
          resultMessage = 'Criteria check failed.';
      } else if (step.criteria.toLowerCase().includes('warn') || randomOutcome < 0.3) {
          status = 'warning';
          resultMessage = 'Check completed with warnings.';
      }

      resolve({ status, resultMessage });
    }, duration);
  });
};


export default function Home() {
  const [steps, setSteps] = useState<VerificationStep[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isReportVisible, setIsReportVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("config");

  const handleStepsChange = (updatedSteps: VerificationStep[]) => {
    setSteps(updatedSteps);
    // Reset report and status if configuration changes
    setIsReportVisible(false);
     setSteps(prevSteps => prevSteps.map(s => ({ ...s, status: 'pending', resultMessage: undefined })));
  };

  const runVerification = useCallback(async () => {
    if (isRunning || steps.length === 0) return;

    setIsRunning(true);
    setIsReportVisible(false);
    setActiveTab("execution"); // Switch to execution tab

    // Reset statuses before running
    setSteps(prevSteps => prevSteps.map(s => ({ ...s, status: 'pending', resultMessage: undefined })));

    for (let i = 0; i < steps.length; i++) {
      const currentStepId = steps[i].id;

      // Set current step to 'running'
      setSteps(prevSteps => prevSteps.map(s =>
        s.id === currentStepId ? { ...s, status: 'running' } : s
      ));

      // Simulate execution
      try {
        const result = await simulateStepExecution(steps[i]);
        // Update step with result
        setSteps(prevSteps => prevSteps.map(s =>
          s.id === currentStepId ? { ...s, ...result } : s
        ));
      } catch (error) {
         console.error("Error executing step:", error);
         // Mark step as failed on error
         setSteps(prevSteps => prevSteps.map(s =>
           s.id === currentStepId ? { ...s, status: 'failure', resultMessage: 'Execution error occurred.' } : s
         ));
      }
    }

    setIsRunning(false);
    setIsReportVisible(true);
    setActiveTab("report"); // Switch to report tab when done
  }, [steps, isRunning]); // Add isRunning to dependencies

   const resetVerification = () => {
    setIsRunning(false);
    setIsReportVisible(false);
    setSteps(prevSteps => prevSteps.map(s => ({ ...s, status: 'pending', resultMessage: undefined })));
    setActiveTab("config");
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">VerifyNow</h1>
         <div className="flex gap-2">
            <Button onClick={runVerification} disabled={isRunning || steps.length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? 'Verifying...' : 'Run Verification'}
            </Button>
             <Button onClick={resetVerification} variant="outline" disabled={isRunning && !isReportVisible}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
            </Button>
         </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="config"><Settings className="mr-2 h-4 w-4 inline-block"/>Configure</TabsTrigger>
          <TabsTrigger value="execution"><Play className="mr-2 h-4 w-4 inline-block"/>Execute</TabsTrigger>
          <TabsTrigger value="report" disabled={!isReportVisible && !isRunning && steps.every(s => s.status === 'pending')}><FileText className="mr-2 h-4 w-4 inline-block"/>Report</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <VerificationConfig initialSteps={steps} onStepsChange={handleStepsChange} />
        </TabsContent>
        <TabsContent value="execution">
          <VerificationExecution steps={steps} isRunning={isRunning} />
        </TabsContent>
        <TabsContent value="report">
          {isReportVisible ? (
            <VerificationReport steps={steps} />
          ) : (
             <Card className="text-center py-10">
                <CardContent>
                    <p className="text-muted-foreground">Run the verification process to generate the report.</p>
                </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </main>
  );
}

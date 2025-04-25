"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { VerificationConfig } from '@/components/verification-config';
import { VerificationExecution } from '@/components/verification-execution';
import { VerificationReport } from '@/components/verification-report';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { VerificationStep, VerificationStatus, CriteriaVerificationStep, ApiVerificationStep } from '@/types/verification';
import { Play, Settings, FileText, RotateCcw, Loader2 } from 'lucide-react';

// Utility function to get value from nested object using dot notation path
const getValueFromPath = (obj: any, path: string): any => {
  return path.split(/[.[\]]+/).filter(Boolean).reduce((acc, part) => acc && acc[part], obj);
};

// Mock function to simulate step execution
const simulateStepExecution = async (step: VerificationStep): Promise<Partial<VerificationStep>> => {
  return new Promise(async (resolve) => {
    const duration = Math.random() * 1500 + 500; // Simulate 0.5 to 2 seconds execution time
    await new Promise(res => setTimeout(res, duration)); // Wait for simulated duration

    let status: VerificationStatus = 'success';
    let resultMessage = 'Verified successfully.';
    const randomOutcome = Math.random();

    if (step.type === 'criteria') {
      // Simulate failures and warnings based on criteria (simple simulation)
      if (step.criteria.toLowerCase().includes('fail') || randomOutcome < 0.15) {
          status = 'failure';
          resultMessage = 'Criteria check failed.';
      } else if (step.criteria.toLowerCase().includes('warn') || randomOutcome < 0.3) {
          status = 'warning';
          resultMessage = 'Check completed with warnings.';
      }
    } else if (step.type === 'api') {
      try {
        // Simulate API call - In a real app, replace this with fetch
        const mockApiResponse = async () => {
          // Simulate different responses based on URL or expected value for testing
          if (step.apiUrl.includes('fail')) {
             return { status: 'error', message: 'Simulated API failure' };
          }
          if (step.expectedValue.toLowerCase() === 'warn_me') {
              return { data: { status: 'OK but with caveats' } }; // Simulate a warning case
          }
          // Simulate a successful response structure
          let response: any = {};
          let current = response;
          const parts = step.apiKeyPath.split(/[.[\]]+/).filter(Boolean);
          parts.forEach((part, index) => {
              if (index === parts.length - 1) {
                  current[part] = step.expectedValue; // Set the final part to the expected value for success
              } else {
                 // Handle array index notation
                 const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
                 if (arrayMatch) {
                     const arrayName = arrayMatch[1];
                     const indexNum = parseInt(arrayMatch[2], 10);
                     if (!current[arrayName]) current[arrayName] = [];
                     while(current[arrayName].length <= indexNum) {
                        current[arrayName].push({});
                     }
                      current = current[arrayName][indexNum];
                 } else {
                     current[part] = {};
                     current = current[part];
                 }
              }
          });
          return response;
        };

        const response = await mockApiResponse();
        const actualValue = getValueFromPath(response, step.apiKeyPath);

        if (actualValue === undefined) {
          status = 'failure';
          resultMessage = `API check failed: Key path "${step.apiKeyPath}" not found in response.`;
        } else if (String(actualValue) === step.expectedValue) {
          status = 'success';
          resultMessage = `API check successful. Value at "${step.apiKeyPath}" matched "${step.expectedValue}".`;
           // Simulate a warning even on success based on a condition
          if (step.expectedValue.toLowerCase() === 'warn_me' || randomOutcome < 0.2) {
             status = 'warning';
             resultMessage = `API check warning: Value matched, but potential issue detected. (${String(actualValue)})`;
          }
        } else {
          status = 'failure';
          resultMessage = `API check failed: Expected "${step.expectedValue}" at "${step.apiKeyPath}", but got "${String(actualValue)}".`;
        }

      } catch (error) {
        console.error("API Step Simulation Error:", error);
        status = 'failure';
        resultMessage = `API check failed: Error during simulated API call.`;
      }
    }

    resolve({ status, resultMessage });
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
     setActiveTab("config"); // Stay on config tab after changes
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

  // Determine if report tab should be disabled
  const isReportTabDisabled = steps.length === 0 || (!isReportVisible && !isRunning && steps.every(s => s.status === 'pending'));

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
          <TabsTrigger value="report" disabled={isReportTabDisabled}><FileText className="mr-2 h-4 w-4 inline-block"/>Report</TabsTrigger>
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
                <CardContent className="pt-6"> {/* Added pt-6 to align with Card standard */}
                    <p className="text-muted-foreground">
                        {steps.length === 0
                         ? "Configure verification steps first."
                         : "Run the verification process to generate the report."}
                    </p>
                </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </main>
  );
}

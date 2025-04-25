"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { VerificationConfig } from '@/components/verification-config';
import { VerificationExecution } from '@/components/verification-execution';
import { VerificationReport } from '@/components/verification-report';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; // Ensure Card and CardContent are imported
import type { VerificationStep, VerificationStatus, CriteriaVerificationStep, ApiVerificationStep } from '@/types/verification';
import { Play, Settings, FileText, RotateCcw, Loader2 } from 'lucide-react';

// Utility function to get value from nested object using dot notation path
const getValueFromPath = (obj: any, path: string): any => {
  return path.split(/[.[\]]+/).filter(Boolean).reduce((acc, part) => {
    // Handle array index access like 'items[0]'
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const indexNum = parseInt(arrayMatch[2], 10);
        return acc && acc[arrayName] && acc[arrayName][indexNum];
    }
    // Handle regular property access
    return acc && acc[part];
  }, obj);
};


// Mock function to simulate step execution
const simulateStepExecution = async (step: VerificationStep): Promise<Partial<VerificationStep>> => {
  return new Promise(async (resolve) => {
    const duration = Math.random() * 1500 + 500; // Simulate 0.5 to 2 seconds execution time
    await new Promise(res => setTimeout(res, duration)); // Wait for simulated duration

    let status: VerificationStatus = 'pending'; // Start as pending, will be updated
    let resultMessage = ''; // Initialize empty message
    const randomOutcome = Math.random();

    if (step.type === 'criteria') {
      // Simulate criteria check
      const criteriaMet = !(step.criteria.toLowerCase().includes('fail') || randomOutcome < 0.15);
      const hasWarning = step.criteria.toLowerCase().includes('warn') || randomOutcome < 0.3;

      if (criteriaMet) {
          if (hasWarning) {
              status = 'warning';
              resultMessage = `Criteria check completed with warnings. Criteria: "${step.criteria}"`;
          } else {
              status = 'success';
              resultMessage = `Criteria verified successfully. Criteria: "${step.criteria}"`;
          }
      } else {
          status = 'failure';
          resultMessage = `Criteria check failed. Criteria: "${step.criteria}"`;
      }
    } else if (step.type === 'api') {
        const requestInfo = `Request: GET ${step.apiUrl} (Token: ${step.apiToken ? 'Provided' : 'Not Provided'})`;
        let responseData: any = null; // To store simulated response data for logging
        let responseStatusInfo = ''; // To store status/error message

        try {
            // Simulate API call - In a real app, replace this with actual fetch
            const mockApiResponse = async () => {
                console.log(`Simulating API call to ${step.apiUrl} ${step.apiToken ? 'with' : 'without'} token.`);
                // Simulate headers check (very basic)
                if (step.apiUrl.includes('requires-auth') && (!step.apiToken || !step.apiToken.startsWith('Bearer valid'))) {
                     console.warn(`Simulated Unauthorized for ${step.apiUrl}. Token: ${step.apiToken}`);
                     return { status: 401, data: { message: 'Simulated Unauthorized - Check API Token' }};
                }
                if (step.apiUrl.includes('fail-request')) { // Simulate a network/500 error
                    return { status: 500, data: { message: 'Simulated API failure' } };
                }
                // Simulate a successful response structure based on path
                let response: any = {};
                let current = response;
                const parts = step.apiKeyPath.split(/[.[\]]+/).filter(Boolean);

                parts.forEach((part, index) => {
                    const isLastPart = index === parts.length - 1;
                    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);

                    if (arrayMatch) {
                        const arrayName = arrayMatch[1];
                        const indexNum = parseInt(arrayMatch[2], 10);
                        if (!current[arrayName]) current[arrayName] = [];
                        while (current[arrayName].length <= indexNum) current[arrayName].push(isLastPart ? null : {});
                        if (isLastPart) current[arrayName][indexNum] = step.expectedValue;
                        else current = current[arrayName][indexNum] = (typeof current[arrayName][indexNum] === 'object' && current[arrayName][indexNum] !== null) ? current[arrayName][indexNum] : {};
                    } else {
                        if (isLastPart) current[part] = step.expectedValue;
                        else current = current[part] = (typeof current[part] === 'object' && current[part] !== null) ? current[part] : {};
                    }
                });

                // Simulate a slightly different value for mismatch failure
                if (step.apiUrl.includes('mismatch-value')) {
                    let target = response;
                    const mismatchParts = step.apiKeyPath.split(/[.[\]]+/).filter(Boolean);
                    for (let i = 0; i < mismatchParts.length - 1; i++) {
                        const part = mismatchParts[i];
                        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
                         if (arrayMatch) {
                             target = target[arrayMatch[1]][parseInt(arrayMatch[2], 10)];
                         } else {
                             target = target[part];
                         }
                    }
                     const lastPart = mismatchParts[mismatchParts.length - 1];
                     const lastArrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
                     if (lastArrayMatch) {
                         target[lastArrayMatch[1]][parseInt(lastArrayMatch[2], 10)] = 'unexpected_value';
                     } else {
                         target[lastPart] = 'unexpected_value';
                     }
                }

                // Simulate a scenario where the key path doesn't exist
                if (step.apiUrl.includes('missing-key')) {
                    response = { unrelatedData: 'some value' };
                }

                 // Simulate a warning condition even if value matches
                 if (step.apiUrl.includes('issue-warning') || randomOutcome < 0.2) {
                     return { status: 200, data: response, warning: 'Potential issue detected during API check.' };
                 }


                return { status: 200, data: response };
            };

            const responseWrapper = await mockApiResponse();
            responseData = responseWrapper.data; // Store response data
            responseStatusInfo = `Status: ${responseWrapper.status}`;

            // Check for HTTP error status codes first
            if (responseWrapper.status >= 400) {
                 status = 'failure';
                 resultMessage = `API request failed. ${responseStatusInfo} - ${responseData?.message || 'Error'}. ${requestInfo}. Response: ${JSON.stringify(responseData)}`;
            } else {
                const actualValue = getValueFromPath({ data: responseData }, `data.${step.apiKeyPath}`); // Wrap data for consistent path finding

                if (actualValue === undefined) {
                    status = 'failure';
                    resultMessage = `API check failed: Key path "${step.apiKeyPath}" not found. ${requestInfo}. Response: ${JSON.stringify(responseData)}`;
                } else if (String(actualValue) === step.expectedValue) {
                    // Value matches, check for explicit warning from response or random warning
                     if (responseWrapper.warning || (step.expectedValue.toLowerCase() === 'warn_me' || randomOutcome < 0.2)) {
                         status = 'warning';
                         resultMessage = `API check warning: ${responseWrapper.warning || 'Potential issue detected.'} Value at "${step.apiKeyPath}" matched "${step.expectedValue}". ${requestInfo}. Response: ${JSON.stringify(responseData)}`;
                     } else {
                         status = 'success';
                         resultMessage = `API check successful. Value at "${step.apiKeyPath}" matched "${step.expectedValue}". ${requestInfo}. Response: ${JSON.stringify(responseData)}`;
                     }
                } else {
                    status = 'failure';
                    resultMessage = `API check failed: Expected "${step.expectedValue}" at "${step.apiKeyPath}", but got "${String(actualValue)}". ${requestInfo}. Response: ${JSON.stringify(responseData)}`;
                }
            }

        } catch (error: any) {
            console.error("API Step Simulation Error:", error);
            status = 'failure';
            responseStatusInfo = `Error: ${error.message || 'Exception during call'}`;
            resultMessage = `API check failed: ${responseStatusInfo}. ${requestInfo}.`;
        }
    } else {
        status = 'failure'; // Should not happen with defined types
        resultMessage = 'Unknown step type encountered.';
    }

    // Limit result message length for display clarity if needed
    // const MAX_MSG_LENGTH = 500;
    // if (resultMessage.length > MAX_MSG_LENGTH) {
    //     resultMessage = resultMessage.substring(0, MAX_MSG_LENGTH) + '... [truncated]';
    // }


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

    const updatedSteps = [...steps]; // Create a mutable copy

    for (let i = 0; i < updatedSteps.length; i++) {
      const currentStepId = updatedSteps[i].id;

      // Set current step to 'running'
      updatedSteps[i] = { ...updatedSteps[i], status: 'running' };
      setSteps([...updatedSteps]); // Update state to show 'running' status

      // Simulate execution
      try {
        const result = await simulateStepExecution(updatedSteps[i]);
        // Update step with result
         updatedSteps[i] = { ...updatedSteps[i], ...result };

      } catch (error) {
         console.error("Error executing step:", error);
         // Mark step as failed on error
         updatedSteps[i] = { ...updatedSteps[i], status: 'failure', resultMessage: `Execution error occurred: ${error instanceof Error ? error.message : String(error)}` };
      }
      setSteps([...updatedSteps]); // Update state with the result of the current step
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
             <Card className="text-center py-10"> {/* Use Card for consistent styling */}
                <CardContent className="pt-6">
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

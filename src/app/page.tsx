
"use client";

import type * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { VerificationConfig } from '@/components/verification-config';
import { VerificationExecution } from '@/components/verification-execution';
import { VerificationReport } from '@/components/verification-report';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { VerificationStep, VerificationStatus, CriteriaVerificationStep, ApiVerificationStep, VerificationSet, ExecutionLogEntry } from '@/types/verification';
import { Play, Settings, FileText, RotateCcw, Loader2, Upload, Download, PlusCircle, Trash2, Edit, Copy, RefreshCcw, History } from 'lucide-react'; // Added History icon
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton


// --- Helper Functions ---

// Utility function to get value from nested object using dot notation path (remains the same)
const getValueFromPath = (obj: any, path: string): any => {
  return path.split(/[.[\]]+/).filter(Boolean).reduce((acc, part) => {
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const indexNum = parseInt(arrayMatch[2], 10);
        return acc && acc[arrayName] && acc[arrayName][indexNum];
    }
    return acc && acc[part];
  }, obj);
};

// Mock function to simulate step execution (remains the same)
const simulateStepExecution = async (step: VerificationStep): Promise<Partial<VerificationStep>> => {
   console.log(`Simulating execution for step: ${step.name}`); // Added log
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
                    console.error(`Simulated 500 error for ${step.apiUrl}`);
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
    console.log(`Step ${step.name} finished with status: ${status}`); // Added log
    resolve({ status, resultMessage });
  });
};

// Function to validate imported JSON data (verification sets)
const validateImportedData = (data: any): data is VerificationSet[] => {
  if (!Array.isArray(data)) return false;
  return data.every(set =>
    typeof set === 'object' &&
    set !== null &&
    typeof set.id === 'string' &&
    typeof set.name === 'string' &&
    Array.isArray(set.steps) &&
    set.steps.every((step: any) =>
      typeof step === 'object' &&
      step !== null &&
      typeof step.id === 'string' &&
      typeof step.name === 'string' &&
      typeof step.description === 'string' &&
      ['pending', 'running', 'success', 'failure', 'warning'].includes(step.status) && // Check status enum
      (step.type === 'criteria' || step.type === 'api') && // Check type enum
      (step.type === 'criteria' ? typeof step.criteria === 'string' : true) &&
      (step.type === 'api' ?
        typeof step.apiUrl === 'string' &&
        typeof step.apiKeyPath === 'string' &&
        typeof step.expectedValue === 'string'
        : true)
    )
  );
};

// Function to determine overall status based on steps
const getOverallStatusFromSteps = (steps: VerificationStep[]): ExecutionLogEntry['overallStatus'] => {
    if (steps.length === 0 || steps.every(s => s.status === 'pending' || s.status === 'running')) return 'pending'; // Check for running too
    if (steps.some(s => s.status === 'failure')) return 'failure';
    if (steps.some(s => s.status === 'warning')) return 'warning';
    if (steps.every(s => s.status === 'success')) return 'success';
    return 'pending'; // Default or if still running/mixed pending/success
};


// --- Main Component ---
const MAX_EXECUTION_HISTORY = 50; // Limit history size

export default function Home() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationSets, setVerificationSets] = useLocalStorage<VerificationSet[]>('verificationSets', []);
  const [activeSetId, setActiveSetId] = useLocalStorage<string | null>('activeVerificationSetId', null);
  const [executionHistory, setExecutionHistory] = useLocalStorage<ExecutionLogEntry[]>('verificationExecutionHistory', []); // History state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isReportVisible, setIsReportVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("config");
  const [newSetName, setNewSetName] = useState('');
  const [editingSetName, setEditingSetName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  // Set isClient to true once the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Find the active configuration set
  const activeSet = verificationSets.find(set => set.id === activeSetId);

   // Ensure an active set exists on mount if there are sets but no active ID
   useEffect(() => {
    // Only run this logic on the client after mount
    if (isClient) {
        if (verificationSets.length > 0 && !activeSetId && !activeSet) {
            setActiveSetId(verificationSets[0].id);
        } else if (verificationSets.length === 0 && activeSetId) {
            setActiveSetId(null); // Clear active ID if no sets exist
        }
    }
   }, [verificationSets, activeSetId, activeSet, setActiveSetId, isClient]); // Add isClient dependency

   // Check if the report was previously visible for the current active set
   useEffect(() => {
     if (activeSet) {
       const hasCompletedSteps = activeSet.steps.some(s => s.status !== 'pending' && s.status !== 'running');
       setIsReportVisible(hasCompletedSteps);
     } else {
       setIsReportVisible(false);
     }
   }, [activeSetId, activeSet]); // Depend on activeSetId to re-evaluate when set changes


  const handleStepsChange = (updatedSteps: VerificationStep[]) => {
    if (!activeSetId) return;
    const updatedSets = verificationSets.map(set =>
      set.id === activeSetId ? { ...set, steps: updatedSteps } : set
    );
    setVerificationSets(updatedSets);
    // Reset report and status if configuration changes
    setIsReportVisible(false);
     // Reset status only for the active set
    const resetStatusSets = updatedSets.map(set =>
        set.id === activeSetId
          ? { ...set, steps: set.steps.map(s => ({ ...s, status: 'pending', resultMessage: undefined })) }
          : set
      );
    setVerificationSets(resetStatusSets);
    setActiveTab("config"); // Stay on config tab after changes
  };

   // Function to add an entry to the execution history
  const logExecution = useCallback((configSet: VerificationSet, startTime: number, endTime: number) => {
    const finalSteps = configSet.steps; // Get the steps with final statuses
    const overallStatus = getOverallStatusFromSteps(finalSteps);
    console.log("Logging execution with overall status:", overallStatus); // Added log

    const logEntry: ExecutionLogEntry = {
        id: Date.now().toString(), // Unique ID for the log entry
        configSetId: configSet.id,
        configSetName: configSet.name,
        startTime: startTime,
        endTime: endTime,
        overallStatus: overallStatus,
        steps: finalSteps.map(step => ({ // Log relevant step details
            id: step.id,
            name: step.name,
            type: step.type,
            status: step.status,
            resultMessage: step.resultMessage,
        })),
    };

    setExecutionHistory(prevHistory => {
        const updatedHistory = [logEntry, ...prevHistory];
        // Limit the history size
        return updatedHistory.slice(0, MAX_EXECUTION_HISTORY);
    });
  }, [setExecutionHistory]);


  const runVerification = useCallback(async (retryFailed = false) => {
    if (isRunning || !activeSetId || !verificationSets.length) return;

    const currentActiveSet = verificationSets.find(set => set.id === activeSetId);
    if (!currentActiveSet || currentActiveSet.steps.length === 0) return;

    console.log("Starting verification run...", retryFailed ? "(Retry)" : "(Full)"); // Added log
    const startTime = Date.now(); // Record start time
    setIsRunning(true);
    setIsReportVisible(false); // Hide report initially
    setActiveTab("execution"); // Switch to execution tab

    // Create a mutable copy of the steps for this run
    let stepsToRun = [...currentActiveSet.steps];

    // Reset statuses before running
    if (retryFailed) {
        // Reset only failed or warning steps to pending for retry
        stepsToRun = stepsToRun.map(s =>
            (s.status === 'failure' || s.status === 'warning')
                ? { ...s, status: 'pending', resultMessage: undefined }
                : s // Keep successful steps as they are
        );
    } else {
        // Full run: Reset all steps to pending
        stepsToRun = stepsToRun.map(s => ({ ...s, status: 'pending', resultMessage: undefined }));
    }

    // Update the state immediately with reset/initial statuses
    setVerificationSets(prevSets => prevSets.map(set =>
        set.id === activeSetId ? { ...set, steps: stepsToRun } : set
    ));

    // Execute steps sequentially
    for (let i = 0; i < stepsToRun.length; i++) {
        const stepToExecute = stepsToRun[i];

        // Skip steps that were already successful if retrying
        if (retryFailed && stepToExecute.status === 'success') {
            continue;
        }

        // Set current step to 'running'
        stepsToRun[i] = { ...stepToExecute, status: 'running' };
        setVerificationSets(prevSets => prevSets.map(set =>
            set.id === activeSetId ? { ...set, steps: [...stepsToRun] } : set // Update with the 'running' status
        ));

        // Simulate execution
        try {
            const result = await simulateStepExecution(stepToExecute);
            // Update the step in our mutable array with the result
            stepsToRun[i] = { ...stepsToRun[i], ...result }; // Apply result status and message
        } catch (error) {
            console.error("Error executing step:", error);
            // Mark step as failed on error
            stepsToRun[i] = { ...stepsToRun[i], status: 'failure', resultMessage: `Execution error occurred: ${error instanceof Error ? error.message : String(error)}` };
        }

        // Update state *after* the step completes with its final status
        setVerificationSets(prevSets => prevSets.map(set =>
            set.id === activeSetId ? { ...set, steps: [...stepsToRun] } : set
        ));
    }

    const endTime = Date.now();
    console.log("Verification run finished."); // Added log

    // Now that the loop is finished and all steps have their final status,
    // update the main state and log the execution.

    // Get the final state of the active set *after* the loop
     const finalActiveSet = { ...currentActiveSet, steps: stepsToRun };

     // Update the main verificationSets state with the final results
     setVerificationSets(prevSets => prevSets.map(set =>
         set.id === activeSetId ? finalActiveSet : set
     ));

     // Log the execution with the final state
     logExecution(finalActiveSet, startTime, endTime);

    // Set state variables after final state update
    setIsRunning(false);
    setIsReportVisible(true); // Show report when finished
    setActiveTab("report"); // Switch to report tab when done

  }, [activeSetId, verificationSets, isRunning, setVerificationSets, logExecution]); // Depend on verificationSets


   const resetVerification = () => {
     if (!activeSetId) return;
     setIsRunning(false);
     setIsReportVisible(false);
     // Reset status only for the active set
     setVerificationSets(prevSets => prevSets.map(set =>
        set.id === activeSetId
          ? { ...set, steps: set.steps.map(s => ({ ...s, status: 'pending', resultMessage: undefined })) }
          : set
      ));
     setActiveTab("config");
  };

   // --- Configuration Set Management ---

    const addConfigurationSet = () => {
        if (!newSetName.trim()) {
            toast({ title: "Error", description: "Configuration name cannot be empty.", variant: "destructive" });
            return;
        }
        const newSet: VerificationSet = {
            id: Date.now().toString(),
            name: newSetName.trim(),
            steps: [],
        };
        const updatedSets = [...verificationSets, newSet];
        setVerificationSets(updatedSets);
        setActiveSetId(newSet.id); // Activate the new set
        setNewSetName(''); // Clear input field
        setActiveTab("config"); // Switch to config tab
        toast({ title: "Success", description: `Configuration "${newSet.name}" added.` });
    };

    const deleteConfigurationSet = (setId: string) => {
        const setToDelete = verificationSets.find(set => set.id === setId);
        if (!setToDelete) return;

        const updatedSets = verificationSets.filter(set => set.id !== setId);
        setVerificationSets(updatedSets);

        toast({ title: "Success", description: `Configuration "${setToDelete.name}" deleted.` });

        // If the deleted set was active, activate the first remaining set or null
        if (activeSetId === setId) {
            setActiveSetId(updatedSets.length > 0 ? updatedSets[0].id : null);
             setIsReportVisible(false); // Hide report if active set is deleted
        }
    };

    const startEditingName = (setId: string) => {
        const set = verificationSets.find(s => s.id === setId);
        if (set) {
            setEditingSetName(set.name);
            setIsEditingName(true);
        }
    };

    const saveEditedName = () => {
        if (!activeSetId || !editingSetName.trim()) {
             toast({ title: "Error", description: "Configuration name cannot be empty.", variant: "destructive" });
             return;
        }
        const updatedSets = verificationSets.map(set =>
            set.id === activeSetId ? { ...set, name: editingSetName.trim() } : set
        );
        setVerificationSets(updatedSets);
        setIsEditingName(false);
        toast({ title: "Success", description: "Configuration name updated." });
    };

     const duplicateConfigurationSet = (setId: string) => {
        const setToDuplicate = verificationSets.find(set => set.id === setId);
        if (!setToDuplicate) return;

        const newSet: VerificationSet = {
            ...setToDuplicate,
            id: Date.now().toString(), // New unique ID
            name: `${setToDuplicate.name} (Copy)`, // Append "(Copy)"
             // Deep copy steps with new IDs and reset status
            steps: setToDuplicate.steps.map(step => ({
                ...step,
                id: `${step.id}-copy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Ensure unique step IDs
                status: 'pending',
                resultMessage: undefined
            }))
        };

        const updatedSets = [...verificationSets, newSet];
        setVerificationSets(updatedSets);
        setActiveSetId(newSet.id); // Activate the duplicated set
        toast({ title: "Success", description: `Configuration "${setToDuplicate.name}" duplicated as "${newSet.name}".` });
        setActiveTab("config"); // Go to config tab
    };


    // --- Import/Export Functionality ---

    const handleExport = () => {
        if (verificationSets.length === 0) {
            toast({ title: "Info", description: "No configurations to export.", variant: "default" });
            return;
        }
        const jsonString = JSON.stringify(verificationSets, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'verify-now-configurations.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Configurations exported." });
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonString = e.target?.result as string;
                const importedData = JSON.parse(jsonString);

                if (!validateImportedData(importedData)) {
                    throw new Error("Invalid JSON structure or content.");
                }

                // Basic merge: Add new sets, overwrite existing by ID
                const existingIds = new Set(verificationSets.map(set => set.id));
                const setsToAdd = importedData.filter(set => !existingIds.has(set.id));
                const setsToUpdate = importedData.filter(set => existingIds.has(set.id));

                let updatedSets = [...verificationSets];
                setsToUpdate.forEach(updateSet => {
                    updatedSets = updatedSets.map(existingSet =>
                        existingSet.id === updateSet.id ? updateSet : existingSet
                    );
                });
                updatedSets = [...updatedSets, ...setsToAdd];


                 // Reset status for all imported/updated steps
                updatedSets = updatedSets.map(set => ({
                    ...set,
                    steps: set.steps.map(step => ({ ...step, status: 'pending', resultMessage: undefined }))
                }));


                setVerificationSets(updatedSets);

                // Activate the first imported set if none was active before or if current active exists in import
                if (importedData.length > 0 && (!activeSetId || importedData.some(s => s.id === activeSetId))) {
                     setActiveSetId(importedData[0].id);
                 } else if (updatedSets.length > 0 && !activeSetId) {
                     setActiveSetId(updatedSets[0].id); // Fallback to first available set
                 }

                toast({ title: "Success", description: "Configurations imported successfully." });
                 setActiveTab("config"); // Go to config tab after import

            } catch (error: any) {
                toast({
                    title: "Import Error",
                    description: `Failed to import configurations: ${error.message || 'Invalid file format.'}`,
                    variant: "destructive",
                });
            } finally {
                // Reset file input value to allow importing the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

     const triggerFileInput = () => {
        fileInputRef.current?.click();
    };


  // Determine if report tab should be disabled
  const stepsForReportCheck = activeSet?.steps || [];
  const isReportTabDisabled = stepsForReportCheck.length === 0 || (!isReportVisible && !isRunning && stepsForReportCheck.every(s => s.status === 'pending'));
  // Determine if Retry button should be enabled
  const canRetry = isReportVisible && !isRunning && stepsForReportCheck.some(s => s.status === 'failure' || s.status === 'warning');

  // Render loading state or skeletons until client is mounted
  if (!isClient) {
    return (
         <main className="container mx-auto p-4 md:p-8">
             <Skeleton className="h-8 w-48 mb-6" /> {/* Title Skeleton */}
             <div className="flex justify-end gap-2 mb-6">
                 <Skeleton className="h-10 w-36" />
                 <Skeleton className="h-10 w-36" />
                 <Skeleton className="h-10 w-36" />
             </div>
             <Card className="mb-6">
                <CardHeader>
                     <Skeleton className="h-6 w-1/3 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col sm:flex-row gap-2 items-end">
                          <div className="flex-grow w-full sm:w-auto space-y-2">
                               <Skeleton className="h-4 w-1/4" />
                               <Skeleton className="h-10 w-full" />
                          </div>
                          <Skeleton className="h-10 w-full sm:w-32" />
                     </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-end">
                          <div className="flex-grow w-full sm:w-auto space-y-2">
                               <Skeleton className="h-4 w-1/4" />
                               <Skeleton className="h-10 w-full" />
                          </div>
                         <div className="flex gap-1 w-full sm:w-auto justify-end">
                              <Skeleton className="h-10 w-10" />
                              <Skeleton className="h-10 w-10" />
                              <Skeleton className="h-10 w-10" />
                         </div>
                     </div>
                </CardContent>
            </Card>
             <Skeleton className="h-8 w-1/2 mb-6" /> {/* Current Config Skeleton */}
             <div className="flex justify-end gap-2 mb-6">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
             </div>
             <Tabs defaultValue="config" className="w-full">
                 <TabsList className="grid w-full grid-cols-3 mb-6">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                 </TabsList>
                  <TabsContent value="config">
                       <Card>
                           <CardHeader>
                                <Skeleton className="h-6 w-1/3 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                           </CardHeader>
                            <CardContent>
                                <Skeleton className="h-24 w-full" />
                            </CardContent>
                       </Card>
                  </TabsContent>
             </Tabs>
         </main>
    );
  }


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">VerifyNow</h1>
          {/* Global Actions */}
          <div className="flex gap-2 flex-wrap"> {/* Added flex-wrap */}
            {/* Import/Export */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                style={{ display: 'none' }} // Hide the actual input
                id="import-file-input"
            />
            <Button variant="outline" onClick={triggerFileInput}>
                <Upload className="mr-2 h-4 w-4" /> Import Configs
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={verificationSets.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export Configs
            </Button>
             {/* Link to History Page */}
             <Link href="/history" passHref legacyBehavior>
                <Button variant="outline" asChild>
                    <a> {/* Use anchor tag for Link child */}
                        <History className="mr-2 h-4 w-4" /> View History
                    </a>
                </Button>
            </Link>
         </div>
      </div>

        {/* Configuration Set Management */}
        <Card className="mb-6">
            <CardHeader>
                 <CardTitle>Manage Configurations</CardTitle>
                 <CardDescription>Create, select, edit, duplicate, or delete verification sets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {/* Add New Set */}
                 <div className="flex flex-col sm:flex-row gap-2 items-end">
                      <div className="flex-grow w-full sm:w-auto">
                        <Label htmlFor="new-config-name">New Configuration Name</Label>
                        <Input
                            id="new-config-name"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="e.g., Production Services"
                        />
                     </div>
                    <Button onClick={addConfigurationSet} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Set
                    </Button>
                 </div>

                 {/* Select Active Set - Only render if there are sets */}
                 {verificationSets.length > 0 ? (
                    <div className="flex flex-col sm:flex-row gap-2 items-end">
                        <div className="flex-grow w-full sm:w-auto">
                            <Label htmlFor="active-config-select">Active Configuration</Label>
                             <Select value={activeSetId ?? ""} onValueChange={(id) => {
                                 setActiveSetId(id);
                                 setActiveTab('config'); // Switch to config tab
                                }}>
                                <SelectTrigger id="active-config-select" className="w-full">
                                    <SelectValue placeholder="Select a configuration set" />
                                </SelectTrigger>
                                <SelectContent>
                                    {verificationSets.map(set => (
                                    <SelectItem key={set.id} value={set.id}>
                                        {set.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                       {activeSet && (
                           <div className="flex gap-1 w-full sm:w-auto justify-end">
                                {/* Edit Name */}
                               <AlertDialog open={isEditingName} onOpenChange={setIsEditingName}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => startEditingName(activeSet.id)} aria-label={`Edit name for ${activeSet.name}`}>
                                             <Edit className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Edit Configuration Name</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Enter a new name for the configuration "{activeSet.name}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <Input
                                            value={editingSetName}
                                            onChange={(e) => setEditingSetName(e.target.value)}
                                            placeholder="New configuration name"
                                            autoFocus
                                            onKeyDown={(e) => { if (e.key === 'Enter') { saveEditedName(); setIsEditingName(false); }}}
                                        />
                                        <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setIsEditingName(false)}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => { saveEditedName(); setIsEditingName(false); }}>Save</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                {/* Duplicate */}
                                <Button variant="ghost" size="icon" onClick={() => duplicateConfigurationSet(activeSet.id)} aria-label={`Duplicate ${activeSet.name}`}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                               {/* Delete */}
                               <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        {/* Disable delete if only one config set exists */}
                                        <Button variant="ghost" size="icon" aria-label={`Delete ${activeSet.name}`} disabled={verificationSets.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the configuration set "{activeSet.name}".
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteConfigurationSet(activeSet.id)} className="bg-destructive hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           </div>
                       )}
                    </div>
                 ) : (
                      <p className="text-muted-foreground text-sm">No configurations found. Add a new set above or import configurations.</p>
                 )}
            </CardContent>
        </Card>


       {/* Tabs for Config, Execution, Report */}
       {activeSet ? (
         <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
             <h2 className="text-2xl font-semibold text-secondary-foreground">
                 Current Configuration: <span className="text-primary">{activeSet.name}</span>
             </h2>
              <div className="flex gap-2">
                <Button onClick={() => runVerification()} disabled={isRunning || !activeSet || activeSet.steps.length === 0} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                    {isRunning ? 'Verifying...' : 'Run Verification'}
                </Button>
                 <Button onClick={() => runVerification(true)} variant="outline" disabled={!canRetry || isRunning} title="Retry failed/warning steps">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Retry
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
              <VerificationConfig initialSteps={activeSet?.steps || []} onStepsChange={handleStepsChange} />
            </TabsContent>
            <TabsContent value="execution">
              <VerificationExecution steps={activeSet?.steps || []} isRunning={isRunning} />
            </TabsContent>
            <TabsContent value="report">
              {isReportVisible ? (
                <VerificationReport steps={activeSet?.steps || []} />
              ) : (
                 <Card className="text-center py-10">
                    <CardHeader>
                         <CardTitle>Report Not Ready</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-muted-foreground">
                            {activeSet && activeSet.steps.length === 0
                             ? "Add verification steps to this configuration first."
                             : "Run the verification process to generate the report."}
                        </p>
                         {!isRunning && stepsForReportCheck.length > 0 && stepsForReportCheck.every(s => s.status === 'pending') && (
                            <p className="text-sm text-accent mt-2">Click 'Run Verification' to start.</p>
                         )}
                         {isRunning && (
                              <p className="text-sm text-accent mt-2">Verification in progress...</p>
                         )}
                    </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          </>
       ) : (
           <Card className="text-center py-10">
                <CardHeader>
                     <CardTitle>No Configuration Selected</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-muted-foreground">
                       Please add a new configuration or select an existing one above to begin.
                    </p>
                </CardContent>
            </Card>
       )}

    </main>
  );
}



"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react'; // Import useEffect
import type { VerificationStep, CriteriaVerificationStep, ApiVerificationStep } from '@/types/verification';
import { VerificationStepForm } from './verification-step-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Edit, FileText, Link as LinkIcon, KeyRound, Ban } from 'lucide-react'; // Added LinkIcon, KeyRound, Ban
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

interface VerificationConfigProps {
  initialSteps: VerificationStep[];
  onStepsChange: (steps: VerificationStep[]) => void;
}

export function VerificationConfig({ initialSteps, onStepsChange }: VerificationConfigProps) {
  const { checkRole } = useAuth(); // Use auth hook
  const isAdmin = checkRole(['admin']);
  const [steps, setSteps] = useState<VerificationStep[]>(initialSteps);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  // Effect to update internal state when the active configuration changes
  useEffect(() => {
    setSteps(initialSteps);
    setEditingStepId(null); // Reset editing state when config set changes
  }, [initialSteps]);

  const addStep = (newStepData: Omit<VerificationStep, 'id' | 'status'>) => {
    if (!isAdmin) return; // Prevent adding if not admin
    const newStep: VerificationStep = {
      ...newStepData,
      id: Date.now().toString(), // Simple ID generation
      status: 'pending',
    };
    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    onStepsChange(updatedSteps);
  };

  const deleteStep = (id: string) => {
     if (!isAdmin) return; // Prevent deleting if not admin
    const updatedSteps = steps.filter(step => step.id !== id);
    setSteps(updatedSteps);
    onStepsChange(updatedSteps);
     // If deleting the step being edited, exit editing mode
    if (editingStepId === id) {
      setEditingStepId(null);
    }
  };

   const startEditing = (id: string) => {
     if (!isAdmin) return; // Prevent editing if not admin
    setEditingStepId(id);
  };

  const cancelEditing = () => {
    setEditingStepId(null);
  };

  const updateStep = (updatedStepData: Omit<VerificationStep, 'id' | 'status'>) => {
    if (!isAdmin || !editingStepId) return; // Prevent updating if not admin
    const updatedSteps = steps.map(step =>
      step.id === editingStepId ? { ...step, ...updatedStepData, status: 'pending' } : step // Reset status on edit
    );
    setSteps(updatedSteps);
    onStepsChange(updatedSteps);
    setEditingStepId(null); // Exit editing mode
  };

  const editingStep = steps.find(step => step.id === editingStepId);

  // Prepare initialData for the form based on the step being edited
   const getInitialFormData = (): Partial<VerificationStep> | undefined => {
    if (!editingStep) return undefined;

    const baseData = {
        id: editingStep.id,
        name: editingStep.name,
        description: editingStep.description,
        type: editingStep.type,
    };

    if (editingStep.type === 'criteria') {
        return { ...baseData, criteria: editingStep.criteria };
    } else if (editingStep.type === 'api') {
        return {
            ...baseData,
            apiUrl: editingStep.apiUrl,
            apiKeyPath: editingStep.apiKeyPath,
            expectedValue: editingStep.expectedValue,
            apiToken: editingStep.apiToken // Include token for editing
        };
    }
    return baseData; // Should not happen with defined types
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Verification Steps</CardTitle>
          <CardDescription>
             {isAdmin
                ? "Define the steps needed to verify the installation using text criteria or API checks."
                : "View the configured verification steps. Only admins can modify these."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {steps.length > 0 && (
                <ul className="space-y-4 mb-6">
                    {steps.map((step) => (
                    <li key={step.id} className="border p-4 rounded-md shadow-sm flex justify-between items-start bg-card">
                        <div className="flex-grow space-y-1 break-words overflow-hidden mr-2"> {/* Added break-words and overflow-hidden, margin right */}
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1"> {/* Added flex-wrap and gap-y */}
                                <h3 className="font-semibold text-base break-all">{step.name}</h3> {/* Added text-base and break-all */}
                                <Badge variant="outline" className="capitalize shrink-0"> {/* Added shrink-0 */}
                                    {step.type === 'criteria' ? <FileText className="h-3 w-3 mr-1"/> : <LinkIcon className="h-3 w-3 mr-1"/>}
                                    {step.type}
                                </Badge>
                            </div>
                            {step.description && <p className="text-sm text-muted-foreground break-words">{step.description}</p>}
                            {step.type === 'criteria' && (
                                <p className="text-sm break-words"><span className="font-medium">Criteria:</span> {step.criteria}</p>
                            )}
                             {step.type === 'api' && (
                                <div className="text-sm space-y-0.5 break-words">
                                    <p><span className="font-medium">API URL:</span> {step.apiUrl}</p>
                                    <p><span className="font-medium">Key Path:</span> {step.apiKeyPath}</p>
                                    <p><span className="font-medium">Expected Value:</span> {step.expectedValue}</p>
                                    {step.apiToken && (
                                         <p className="flex items-center">
                                            <KeyRound className="h-3 w-3 mr-1 text-muted-foreground shrink-0"/>
                                            <span className="font-medium mr-1">API Token:</span>
                                            <span className="italic text-muted-foreground">Provided (masked)</span>
                                         </p>
                                    )}
                                </div>
                            )}
                        </div>
                         {isAdmin && ( // Only show edit/delete buttons to admins
                            <div className="flex space-x-1 shrink-0 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => startEditing(step.id)} aria-label={`Edit ${step.name}`}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteStep(step.id)} aria-label={`Delete ${step.name}`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                         )}
                    </li>
                    ))}
                </ul>
            )}

           {/* Only show Add/Edit form to Admins */}
            {isAdmin && (
                <>
                   {editingStepId && editingStep ? (
                        <div className='mt-4 space-y-2'>
                            <h4 className="font-semibold text-lg mb-2">Editing Step: {editingStep.name}</h4>
                            <VerificationStepForm
                                key={editingStepId} // Force re-render on edit change
                                onSubmit={updateStep}
                                initialData={getInitialFormData()}
                                buttonText="Update Step"
                                disabled={!isAdmin} // Disable form if not admin (redundant but safe)
                            />
                            <Button variant="outline" onClick={cancelEditing} className="mt-2">Cancel Edit</Button>
                        </div>
                    ) : (
                        <VerificationStepForm onSubmit={addStep} disabled={!isAdmin} /> // Disable form if not admin
                    )}
                </>
            )}

             {steps.length === 0 && !isAdmin && (
                 <p className="text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                      <Ban className="h-4 w-4"/> No steps defined. Only admins can add steps.
                 </p>
             )}
             {steps.length === 0 && isAdmin && !editingStepId && (
                <p className="text-muted-foreground text-center py-4">No steps defined for this configuration. Add a step below.</p>
            )}

        </CardContent>
      </Card>
    </div>
  );
}


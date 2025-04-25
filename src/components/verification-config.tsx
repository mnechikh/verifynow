"use client";

import type * as React from 'react';
import { useState } from 'react';
import type { VerificationStep, CriteriaVerificationStep, ApiVerificationStep } from '@/types/verification';
import { VerificationStepForm } from './verification-step-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Edit, FileText, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import { Badge } from "@/components/ui/badge"; // Added Badge

interface VerificationConfigProps {
  initialSteps: VerificationStep[];
  onStepsChange: (steps: VerificationStep[]) => void;
}

export function VerificationConfig({ initialSteps, onStepsChange }: VerificationConfigProps) {
  const [steps, setSteps] = useState<VerificationStep[]>(initialSteps);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const addStep = (newStepData: Omit<VerificationStep, 'id' | 'status'>) => {
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
    const updatedSteps = steps.filter(step => step.id !== id);
    setSteps(updatedSteps);
    onStepsChange(updatedSteps);
     // If deleting the step being edited, exit editing mode
    if (editingStepId === id) {
      setEditingStepId(null);
    }
  };

   const startEditing = (id: string) => {
    setEditingStepId(id);
  };

  const cancelEditing = () => {
    setEditingStepId(null);
  };

  const updateStep = (updatedStepData: Omit<VerificationStep, 'id' | 'status'>) => {
    if (!editingStepId) return;
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
            expectedValue: editingStep.expectedValue
        };
    }
    return baseData; // Should not happen with defined types
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Verification Steps</CardTitle>
          <CardDescription>Define the steps needed to verify the installation using text criteria or API checks.</CardDescription>
        </CardHeader>
        <CardContent>
            {steps.length > 0 && (
                <ul className="space-y-4 mb-6">
                    {steps.map((step) => (
                    <li key={step.id} className="border p-4 rounded-md shadow-sm flex justify-between items-start bg-card">
                        <div className="flex-grow space-y-1">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{step.name}</h3>
                                <Badge variant="outline" className="capitalize">
                                    {step.type === 'criteria' ? <FileText className="h-3 w-3 mr-1"/> : <LinkIcon className="h-3 w-3 mr-1"/>}
                                    {step.type}
                                </Badge>
                            </div>
                            {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                            {step.type === 'criteria' && (
                                <p className="text-sm"><span className="font-medium">Criteria:</span> {step.criteria}</p>
                            )}
                             {step.type === 'api' && (
                                <div className="text-sm space-y-0.5">
                                    <p><span className="font-medium">API URL:</span> {step.apiUrl}</p>
                                    <p><span className="font-medium">Key Path:</span> {step.apiKeyPath}</p>
                                    <p><span className="font-medium">Expected Value:</span> {step.expectedValue}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex space-x-1 shrink-0 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => startEditing(step.id)} aria-label={`Edit ${step.name}`}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteStep(step.id)} aria-label={`Delete ${step.name}`}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </li>
                    ))}
                </ul>
            )}

           {editingStepId && editingStep ? (
                <div className='mt-4 space-y-2'>
                    <VerificationStepForm
                        key={editingStepId} // Force re-render on edit change
                        onSubmit={updateStep}
                        initialData={getInitialFormData()}
                        buttonText="Update Step"
                    />
                    <Button variant="outline" onClick={cancelEditing} className="mt-2">Cancel Edit</Button>
                </div>
            ) : (
                 <VerificationStepForm onSubmit={addStep} />
            )}

        </CardContent>
      </Card>
    </div>
  );
}

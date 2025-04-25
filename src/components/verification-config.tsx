"use client";

import type * as React from 'react';
import { useState } from 'react';
import type { VerificationStep } from '@/types/verification';
import { VerificationStepForm } from './verification-step-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Edit } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configure Verification Steps</CardTitle>
          <CardDescription>Define the steps needed to verify the installation.</CardDescription>
        </CardHeader>
        <CardContent>
            {steps.length > 0 && (
                <ul className="space-y-4 mb-6">
                    {steps.map((step) => (
                    <li key={step.id} className="border p-4 rounded-md shadow-sm flex justify-between items-start bg-card">
                        <div>
                            <h3 className="font-semibold">{step.name}</h3>
                            {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
                            <p className="text-sm mt-1"><span className="font-medium">Criteria:</span> {step.criteria}</p>
                        </div>
                        <div className="flex space-x-2 shrink-0 ml-4">
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
                <div className='mt-4'>
                    <VerificationStepForm
                        key={editingStepId} // Force re-render on edit change
                        onSubmit={updateStep}
                        initialData={{ name: editingStep.name, description: editingStep.description, criteria: editingStep.criteria }}
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

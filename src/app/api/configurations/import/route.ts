
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { VerificationSetArraySchema } from '@/types/verification';

/**
 * API route to handle importing verification configurations via JSON payload.
 *
 * NOTE: This endpoint currently only validates the incoming JSON data structure.
 * It does NOT persist the data because the application's state management
 * relies on client-side localStorage. To make this endpoint fully functional
 * for saving data, the application would need to be refactored to use a
 * server-side storage mechanism (e.g., database, file system).
 */
export async function POST(request: NextRequest) {
  try {
    const jsonData = await request.json();

    // Validate the incoming data against the schema for an array of VerificationSet
    const validationResult = VerificationSetArraySchema.safeParse(jsonData);

    if (!validationResult.success) {
      console.error("Import API Validation Error:", validationResult.error.errors);
      return NextResponse.json(
        { message: 'Invalid configuration format provided.', errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    const importedConfigs = validationResult.data;

    // --- Persistence Logic Placeholder ---
    // In a real scenario with server-side storage, you would add logic here
    // to save/update the `importedConfigs` in your database or file system.
    // For example:
    // await saveConfigurationsToDatabase(importedConfigs);
    // Since we are using localStorage, we cannot directly modify it here.
    console.log(`Received ${importedConfigs.length} configurations for import via API (validation successful, no persistence).`);
    // ------------------------------------

    return NextResponse.json(
        { message: 'Configuration data received and validated successfully. Note: Persistence is not implemented for localStorage via API.' },
        { status: 200 }
    );

  } catch (error) {
    console.error('Error processing configuration import request:', error);
     if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON payload.' }, { status: 400 });
     }
    return NextResponse.json({ message: 'Internal Server Error during import.' }, { status: 500 });
  }
}

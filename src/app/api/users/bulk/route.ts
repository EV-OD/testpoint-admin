
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const users: User[] = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ message: 'Missing or invalid users array' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: { email: string, reason: string }[] = [];

    const creationPromises = users.map(async (user) => {
        try {
            if (!user.name || !user.email || !user.password || !user.role) {
                throw new Error('Missing required fields for user.');
            }

            const userRecord = await adminAuth.createUser({
                email: user.email,
                password: user.password,
                displayName: user.name,
            });

            await adminDb.collection('users').doc(userRecord.uid).set({
                name: user.name,
                email: user.email,
                role: user.role,
            });

            successCount++;

        } catch (error: any) {
            errorCount++;
            let reason = 'An unknown error occurred.';
            if (error.code === 'auth/email-already-exists') {
                reason = 'Email is already in use by another account.';
            } else if (error.message) {
                reason = error.message;
            }
            errors.push({ email: user.email, reason });
        }
    });

    await Promise.all(creationPromises);
    
    return NextResponse.json({
        message: 'Bulk user import completed.',
        successCount,
        errorCount,
        errors,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error during bulk user import:', error);
    return NextResponse.json({ message: 'Failed to process bulk import', error: error.message }, { status: 500 });
  }
}

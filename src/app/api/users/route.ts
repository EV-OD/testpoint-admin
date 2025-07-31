import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const authUsers = listUsersResult.users;

    const userIds = authUsers.map(user => user.uid);
    const usersCollection = adminDb.collection('users');
    const usersMap = new Map<string, any>();

    // Firestore `where in` query has a limit of 30 equality clauses.
    // If you have more than 30 users, this will need to be chunked.
    if (userIds.length > 0) {
        const usersQuerySnapshot = await usersCollection.where(admin.firestore.FieldPath.documentId(), 'in', userIds).get();
        usersQuerySnapshot.forEach(doc => {
            usersMap.set(doc.id, doc.data());
        });
    }
    

    const users: User[] = authUsers.map(userRecord => {
        const firestoreUser = usersMap.get(userRecord.uid);
        return {
            id: userRecord.uid,
            name: userRecord.displayName || firestoreUser?.name || 'N/A',
            email: userRecord.email || '',
            role: firestoreUser?.role || 'student', // Default role if not in firestore
        };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // We use the user's UID as the document ID in Firestore.
    await adminDb.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
    });

    return NextResponse.json({ id: userRecord.uid, name, email, role }, { status: 201 });
  } catch (error: any)
    {
    console.error('Error creating user:', error);
     if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email is already in use by another account.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}
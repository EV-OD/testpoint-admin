import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

export async function GET() {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const userRecords = listUsersResult.users;

    const usersQuerySnapshot = await adminDb.collection('users').get();
    const usersMap = new Map();
    usersQuerySnapshot.forEach(doc => {
        const data = doc.data();
        usersMap.set(data.email, { id: doc.id, ...data });
    });

    const users: User[] = userRecords.map(userRecord => {
        const firestoreUser = usersMap.get(userRecord.email);
        return {
            id: userRecord.uid,
            name: userRecord.displayName || firestoreUser?.name || 'N/A',
            email: userRecord.email || '',
            role: firestoreUser?.role || 'student',
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

    await adminDb.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role,
    });

    return NextResponse.json({ id: userRecord.uid, name, email, role }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
     if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email is already in use by another account.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}

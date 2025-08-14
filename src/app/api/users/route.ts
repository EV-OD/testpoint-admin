
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import admin from 'firebase-admin';

export async function GET() {
  try {
    const listUsersResult = await adminAuth.listUsers();
    const authUsers = listUsersResult.users;

    const userIds = authUsers.map(user => user.uid);
    
    // Fetch user roles from Firestore 'users' collection
    const usersCollection = adminDb.collection('users');
    const usersMap = new Map<string, any>();
    if (userIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 30) {
        chunks.push(userIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        if (chunk.length > 0) {
            const usersQuerySnapshot = await usersCollection.where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
            usersQuerySnapshot.forEach(doc => {
                usersMap.set(doc.id, doc.data());
            });
        }
      }
    }

    // Fetch groups to map users to groups
    const groupsSnapshot = await adminDb.collection('groups').get();
    const userGroupsMap = new Map<string, string[]>();
    groupsSnapshot.forEach(doc => {
        const group = doc.data();
        if (Array.isArray(group.userIds)) {
            group.userIds.forEach((userId: string) => {
                if (!userGroupsMap.has(userId)) {
                    userGroupsMap.set(userId, []);
                }
                userGroupsMap.get(userId)?.push(group.name);
            });
        }
    });
    
    const users: User[] = authUsers.map(userRecord => {
        const firestoreUser = usersMap.get(userRecord.uid);
        return {
            id: userRecord.uid,
            name: userRecord.displayName || firestoreUser?.name || 'N/A',
            email: userRecord.email || '',
            role: firestoreUser?.role || 'student',
            groups: userGroupsMap.get(userRecord.uid) || [],
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
  } catch (error: any)
    {
    console.error('Error creating user:', error);
     if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ message: 'Email is already in use by another account.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}

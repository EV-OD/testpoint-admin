
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { name, role } = await request.json();

    if (!id || !name || !role) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await adminAuth.updateUser(id, {
        displayName: name,
    });

    await adminDb.collection('users').doc(id).update({
        name,
        role,
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error: any) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update user', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    if (!id) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    await adminAuth.deleteUser(id);
    await adminDb.collection('users').doc(id).delete();

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting user ${id}:`, error);
     if (error.code === 'auth/user-not-found') {
      // If user is not in Auth, still try to delete from Firestore
      try {
        await adminDb.collection('users').doc(id).delete();
        return NextResponse.json({ message: 'User deleted from Firestore.' });
      } catch (dbError: any) {
         return NextResponse.json({ message: 'User not found in Auth, and failed to delete from Firestore.', error: dbError.message }, { status: 500 });
      }
    }
    return NextResponse.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
  }
}

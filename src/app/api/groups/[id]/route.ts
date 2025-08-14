
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const groupDoc = await adminDb.collection('groups').doc(id).get();

    if (!groupDoc.exists) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }
    
    const groupData = groupDoc.data();
    return NextResponse.json({
        id: groupDoc.id,
        name: groupData?.name,
        userIds: groupData?.userIds || [],
    });

  } catch (error: any) {
    console.error(`Error fetching group ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch group', error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { name, userIds } = await request.json();

    if (!id || !name || !Array.isArray(userIds)) {
        return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }

    await adminDb.collection('groups').doc(id).update({
        name,
        userIds,
    });

    return NextResponse.json({ message: 'Group updated successfully' });
  } catch (error: any) {
    console.error(`Error updating group ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update group', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    if (!id) {
        return NextResponse.json({ message: 'Group ID is required' }, { status: 400 });
    }
    
    await adminDb.collection('groups').doc(id).delete();

    return NextResponse.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting group ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete group', error: error.message }, { status: 500 });
  }
}

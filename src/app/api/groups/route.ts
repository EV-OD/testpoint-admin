
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, userIds } = await request.json();

    if (!name || !Array.isArray(userIds)) {
      return NextResponse.json({ message: 'Missing or invalid required fields' }, { status: 400 });
    }

    const groupRef = await adminDb.collection('groups').add({
      name,
      userIds,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ id: groupRef.id, name, userIds }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ message: 'Failed to create group', error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const groupsSnapshot = await adminDb.collection('groups').get();
    const groups = groupsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            member_count: Array.isArray(data.userIds) ? data.userIds.length : 0,
        }
    });
    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ message: 'Failed to fetch groups', error: error.message }, { status: 500 });
  }
}

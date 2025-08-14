
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const { name, group_id, time_limit, question_count, date_time } = await request.json();

    if (!id || !name || !group_id || !time_limit || !question_count || !date_time) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await adminDb.collection('tests').doc(id).update({
        name,
        group_id,
        time_limit,
        question_count,
        date_time,
    });

    return NextResponse.json({ message: 'Test updated successfully' });
  } catch (error: any) {
    console.error(`Error updating test ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update test', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    if (!id) {
        return NextResponse.json({ message: 'Test ID is required' }, { status: 400 });
    }
    
    await adminDb.collection('tests').doc(id).delete();

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting test ${id}:`, error);
    return NextResponse.json({ message: 'Failed to delete test', error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

import { getCurrentUserContext } from '@/lib/auth';
import { getProfileById, getProjectAnalytics } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const { user } = await getCurrentUserContext();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getProfileById(user.id);

  if (profile?.role !== 'admin' || !projectId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const analytics = await getProjectAnalytics(projectId);
  return NextResponse.json(analytics);
}
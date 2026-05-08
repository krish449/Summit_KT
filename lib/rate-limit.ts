import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';

export async function checkRateLimit(
  userId: string,
  action: string,
  maxPerWindow: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServiceRoleSupabaseClient();
  if (!supabase) return { allowed: true, remaining: maxPerWindow };

  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();

  const { count } = await supabase
    .from('activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', since);

  const used = count ?? 0;
  const remaining = Math.max(0, maxPerWindow - used);
  return { allowed: used < maxPerWindow, remaining };
}

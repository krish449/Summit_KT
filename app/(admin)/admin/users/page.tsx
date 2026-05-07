import { KeyRound, UserRound } from 'lucide-react';

import { createDemoUserAction, toggleUserActiveAction, updateUserRoleAction } from '@/app/actions/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllProjects, getAllUsers } from '@/lib/data';
import { formatDate } from '@/lib/utils';

export default async function AdminUsersPage() {
  const [users, projects] = await Promise.all([getAllUsers(), getAllProjects()]);
  const activeProjects = projects.filter((p) => p.is_active);

  return (
    <div className="space-y-8">

      {/* Demo user panel */}
      <Card className="border-brand-200 bg-gradient-to-br from-brand-50/60 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700">
              <UserRound className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle>Create demo user</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Creates a member account you can use to test the quiz and chat experience. No email confirmation needed.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Fixed credentials display */}
          <div className="grid gap-3 rounded-2xl border border-brand-100 bg-white p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <UserRound className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                <p className="font-mono text-sm font-semibold text-slate-800">demo@summit.app</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <KeyRound className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Password</p>
                <p className="font-mono text-sm font-semibold text-slate-800">Demo@Summit1</p>
              </div>
            </div>
          </div>

          {/* Project assignment + create */}
          <form action={createDemoUserAction} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Assign to project</label>
              <select
                name="project_id"
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
              >
                <option value="">— none —</option>
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit">
              Create / reset demo user
            </Button>
          </form>
          <p className="text-xs text-slate-400">
            If the demo user already exists, clicking the button again just re-assigns them to the selected project.
          </p>
        </CardContent>
      </Card>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length ? (
            users.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-900">{user.full_name ?? user.email}</p>
                    <Badge variant={user.role === 'admin' ? 'info' : 'neutral'}>{user.role}</Badge>
                    <Badge variant={user.is_active === false ? 'warning' : 'success'}>
                      {user.is_active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Created {formatDate(user.created_at, true)} • Last login {formatDate(user.last_login_at, true)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <form action={updateUserRoleAction}>
                    <input name="user_id" type="hidden" value={user.id} />
                    <input name="role" type="hidden" value={user.role === 'admin' ? 'member' : 'admin'} />
                    <Button type="submit" variant="secondary">
                      {user.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                    </Button>
                  </form>
                  <form action={toggleUserActiveAction}>
                    <input name="user_id" type="hidden" value={user.id} />
                    <input name="next_state" type="hidden" value={String(user.is_active === false)} />
                    <Button type="submit" variant={user.is_active === false ? 'primary' : 'danger'}>
                      {user.is_active === false ? 'Reactivate' : 'Deactivate'}
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No users found.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

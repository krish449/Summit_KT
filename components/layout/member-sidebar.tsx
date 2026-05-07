'use client';

import { FolderOpen, LayoutDashboard } from 'lucide-react';

import { Sidebar } from './sidebar';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'My Projects', icon: FolderOpen },
];

export function MemberSidebar() {
  return <Sidebar items={items} sectionLabel="Member" />;
}

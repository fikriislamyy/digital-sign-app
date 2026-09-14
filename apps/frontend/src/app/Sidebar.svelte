<script lang="ts">
  import { auth } from '../lib/auth.svelte';

  const sections = [
    { label: 'Dashboard', href: '#/app/dashboard', icon: '📊' },
    { label: 'Documents', href: '#/app/documents', icon: '📄' },
    { label: 'Templates', href: '#/app/templates', icon: '📋' },
    { label: 'Signings', href: '#/app/signings', icon: '✍️' },
    { label: 'Analytics', href: '#/app/analytics', icon: '📈' },
    { label: 'Team', href: '#/app/team', icon: '👥', rolesRequired: ['OWNER', 'ADMIN'] },
    { label: 'Settings', href: '#/app/settings', icon: '⚙️' },
    { label: 'Billing', href: '#/app/billing', icon: '💳', rolesRequired: ['OWNER'] },
    { label: 'Audit Log', href: '#/app/audit', icon: '📋', rolesRequired: ['OWNER', 'ADMIN'] },
    { label: 'Integrations', href: '#/app/integrations', icon: '🔗' },
    { label: 'Help', href: '#/app/help', icon: '❓' },
    { label: 'Profile', href: '#/app/profile', icon: '👤' },
  ];

  let currentPath = $state(window.location.hash);

  $effect(() => {
    const handler = () => {
      currentPath = window.location.hash;
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  });

  function isActive(href: string) {
    return currentPath.startsWith(href);
  }

  function canView(rolesRequired?: string[]) {
    if (!rolesRequired) return true;
    return auth.profile && rolesRequired.includes(auth.profile.user.type);
  }
</script>

<aside class="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
  <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
    {#each sections as section}
      {#if canView(section.rolesRequired)}
        <a
          href={section.href}
          class="block px-3 py-2 rounded-lg text-sm font-medium transition {isActive(section.href)
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}"
        >
          <span class="inline-block mr-2">{section.icon}</span>
          {section.label}
        </a>
      {/if}
    {/each}
  </nav>
</aside>

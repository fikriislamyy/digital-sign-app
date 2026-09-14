<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import Field from './Field.svelte';
  import PasswordField from './PasswordField.svelte';
  import { register } from '../lib/api';
  import { auth } from '../lib/auth.svelte';
  import { router } from '../lib/router.svelte';

  type Kind = 'personal' | 'organization';
  let kind = $state<Kind>('personal');

  let organization = $state('');
  let fullName = $state('');
  let phone = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let formError = $state('');
  let busy = $state(false);

  const tabs: { id: Kind; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'organization', label: 'Organization' },
  ];

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';

    if (kind === 'organization' && !organization.trim()) {
      formError = 'Enter your organization name.';
      return;
    }

    if (!fullName.trim()) {
      formError = 'Enter your full name.';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      formError = 'Enter a valid email address.';
      return;
    }

    if (password.length < 6) {
      formError = 'Password must be at least 6 characters.';
      return;
    }

    if (password !== confirmPassword) {
      formError = 'Passwords do not match.';
      return;
    }

    busy = true;
    try {
      const result = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        phone_number: phone.trim() || undefined,
        organization_name: kind === 'organization' ? organization.trim() : undefined,
      });

      auth.save(result.access_token, result.refresh_token);
      router.navigate(`/verify?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not create account.';
    } finally {
      busy = false;
    }
  }
</script>

<AuthLayout>
  <h1 class="mb-2 text-4xl font-bold text-fg">Create your account</h1>
  <p class="mb-10 text-fg-muted">Join SignCraft for secure digital signatures.</p>

  <div role="tablist" aria-label="Account type" class="mb-8 grid grid-cols-2 gap-1 rounded-lg bg-gray-1 p-1 dark:bg-gray-2">
    {#each tabs as tab}
      <button
        type="button"
        role="tab"
        id="tab-{tab.id}"
        aria-selected={kind === tab.id}
        aria-controls="signup-form"
        onclick={() => (kind = tab.id)}
        class="rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 {kind === tab.id
          ? 'bg-bg-elevated text-fg shadow-card'
          : 'text-fg-muted hover:text-fg'}"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <div role="tabpanel" aria-labelledby="tab-{kind}">
    <form id="signup-form" onsubmit={onSubmit} class="space-y-5" novalidate>
    {#if kind === 'organization'}
      <Field label="Organization name" bind:value={organization} placeholder="Acme Inc." required />
    {/if}
    <Field label="Full name" bind:value={fullName} placeholder="Jane Doe" required />
    <Field label="Phone number" type="tel" bind:value={phone} placeholder="+628123456789" />
    <Field label="Email" type="email" bind:value={email} placeholder="jane@acme.com" required />
    <PasswordField label="Password" bind:value={password} placeholder="••••••••" />
    <PasswordField label="Confirm password" bind:value={confirmPassword} placeholder="••••••••" />

    {#if formError}
      <p role="alert" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
        {formError}
      </p>
    {/if}

    <button
      type="submit"
      disabled={busy}
      class="w-full rounded-lg bg-accent px-6 py-3.5 font-semibold text-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
    >
      {busy ? 'Creating account…' : 'Sign up'}
    </button>
    </form>
  </div>

  <p class="mt-8 text-center text-sm text-fg-muted">
    Already have an account?
    <a href="/login" class="font-medium text-accent transition-opacity duration-300 hover:opacity-80">Sign in</a>
  </p>
</AuthLayout>

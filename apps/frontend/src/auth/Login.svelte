<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import Field from './Field.svelte';
  import PasswordField from './PasswordField.svelte';
  import { login } from '../lib/api';
  import { auth } from '../lib/auth.svelte';

  let email = $state('');
  let password = $state('');
  let formError = $state('');
  let busy = $state(false);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';

    if (!email.trim() || !password) {
      formError = 'Enter your email and password.';
      return;
    }

    busy = true;
    try {
      const result = await login(email.trim(), password);
      auth.save(result.user, result.access_token, result.refresh_token);
      window.location.hash = '#/app';
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not sign in.';
    } finally {
      busy = false;
    }
  }
</script>

<AuthLayout>
  <h1 class="mb-2 text-4xl font-bold text-fg">Welcome back</h1>
  <p class="mb-10 text-fg-muted">Sign in to your SignCraft account.</p>

  <form onsubmit={onSubmit} class="space-y-5" novalidate>
    <Field label="Email" type="email" bind:value={email} placeholder="you@company.com" required />
    <PasswordField label="Password" bind:value={password} placeholder="••••••••" />

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
      {busy ? 'Signing in…' : 'Sign in'}
    </button>
  </form>

  <p class="mt-8 text-center text-sm text-fg-muted">
    No account?
    <a href="#/signup" class="font-medium text-accent transition-opacity duration-300 hover:opacity-80">Create one</a>
  </p>
</AuthLayout>

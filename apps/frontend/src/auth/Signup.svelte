<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import Field from './Field.svelte';
  import PasswordField from './PasswordField.svelte';
  import { register } from '../lib/api';

  let organization = $state('');
  let fullName = $state('');
  let phone = $state('');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let formError = $state('');
  let busy = $state(false);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';

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
      await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        organization: organization.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      window.location.hash = `#/verify?email=${encodeURIComponent(email.trim())}`;
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

  <form onsubmit={onSubmit} class="space-y-5" novalidate>
    <Field label="Organization name" bind:value={organization} placeholder="ACME Inc." />
    <Field label="Full name" bind:value={fullName} placeholder="Jane Doe" required />
    <Field label="Phone number" bind:value={phone} placeholder="+1 (555) 123-4567" />
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

  <p class="mt-8 text-center text-sm text-fg-muted">
    Already have an account?
    <a href="#/login" class="font-medium text-accent transition-opacity duration-300 hover:opacity-80">Sign in</a>
  </p>
</AuthLayout>

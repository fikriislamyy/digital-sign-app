<script lang="ts">
  import AuthLayout from './AuthLayout.svelte';
  import { verifyEmail, resendOtp } from '../lib/api';
  import { hashParam } from '../lib/hash';

  const email = hashParam('email');

  let code = $state('');
  let formError = $state('');
  let notice = $state('');
  let busy = $state(false);
  let resending = $state(false);

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    formError = '';
    notice = '';

    if (code.trim().length !== 6) {
      formError = 'Enter the 6-digit code from your email.';
      return;
    }

    busy = true;
    try {
      await verifyEmail(email, code.trim());
      window.location.hash = '#/login';
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not verify that code.';
    } finally {
      busy = false;
    }
  }

  async function onResend() {
    formError = '';
    notice = '';
    resending = true;
    try {
      await resendOtp(email);
      notice = 'A new code is on its way.';
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Could not resend the code.';
    } finally {
      resending = false;
    }
  }
</script>

<AuthLayout>
  <h1 class="mb-2 text-4xl font-bold text-fg">Verify your email</h1>
  <p class="mb-10 text-fg-muted">Enter the code we sent to your inbox.</p>

  {#if email}
    <p class="mb-6 text-sm text-fg-muted">We sent a code to <span class="font-medium text-fg">{email}</span></p>

    <form onsubmit={onSubmit} class="space-y-5" novalidate>
      <div>
        <label for="code" class="mb-2 block text-sm font-medium text-fg">Verification code</label>
        <input
          id="code"
          bind:value={code}
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="000000"
          class="input text-center font-mono text-3xl tracking-[0.5em]"
          aria-invalid={formError ? 'true' : undefined}
        />
      </div>

      {#if formError}
        <p role="alert" class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {formError}
        </p>
      {/if}

      {#if notice}
        <p class="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {notice}
        </p>
      {/if}

      <button
        type="submit"
        disabled={busy}
        class="w-full rounded-lg bg-accent px-6 py-3.5 font-semibold text-white transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
      >
        {busy ? 'Verifying…' : 'Verify'}
      </button>
    </form>

    <div class="mt-8 text-center">
      <button
        type="button"
        onclick={onResend}
        disabled={resending}
        class="text-sm font-medium text-accent transition-opacity duration-300 hover:opacity-80 disabled:opacity-50"
      >
        {resending ? 'Sending…' : 'Resend code'}
      </button>
    </div>
  {:else}
    <div class="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
      <p class="mb-3">No email provided. Go back to sign up.</p>
      <a href="#/signup" class="inline-block rounded bg-yellow-600 px-4 py-2 text-white transition-opacity hover:opacity-80">
        Create account
      </a>
    </div>
  {/if}
</AuthLayout>

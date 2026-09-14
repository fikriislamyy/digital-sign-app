<script lang="ts">
  import ToggleButton from '../ui/ToggleButton.svelte';

  interface Props {
    label: string;
    value: string;
    placeholder?: string;
    error?: string;
  }
  let { label, value = $bindable(), placeholder = '', error = '' }: Props = $props();

  let visible = $state(false);
  const id = `p-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div>
  <label for={id} class="mb-2 block text-sm font-medium text-fg">{label}</label>
  <div class="relative">
    <input
      {id}
      {placeholder}
      type={visible ? 'text' : 'password'}
      bind:value
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${id}-e` : undefined}
      class="input pr-12"
    />
    <ToggleButton
      bind:pressed={visible}
      label={visible ? 'Hide password' : 'Show password'}
      class="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted transition-opacity duration-300 hover:opacity-70"
    >
      {#snippet children(on)}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          {#if on}
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
          {:else}
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
          {/if}
        </svg>
      {/snippet}
    </ToggleButton>
  </div>
  {#if error}<p id="{id}-e" class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>

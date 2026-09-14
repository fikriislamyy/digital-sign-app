<script lang="ts">
  interface Props {
    label: string;
    value: string;
    type?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }
  let { label, value = $bindable(), type = 'text', placeholder = '',
        error = '', required = false }: Props = $props();

  const id = `f-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div>
  <label for={id} class="mb-2 block text-sm font-medium text-fg">{label}</label>
  <input
    {id}
    {type}
    {placeholder}
    {required}
    bind:value
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${id}-e` : undefined}
    class="input"
  />
  {#if error}<p id="{id}-e" class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>

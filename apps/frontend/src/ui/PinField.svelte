<script lang="ts">
  import { PinInput } from 'melt/builders';

  interface Props {
    value: string;
    length?: number;
    label: string;
    error?: string;
    /** Called with the full code as soon as the last digit is typed or pasted. */
    oncomplete?: (code: string) => void;
  }
  let { value = $bindable(), length = 6, label, error = '', oncomplete }: Props = $props();

  const pin = new PinInput({
    value: () => value,
    onValueChange: (v) => (value = v),
    maxLength: () => length,
    type: 'numeric',
    placeholder: '',
    onComplete: (code) => oncomplete?.(code),
  });
</script>

<div>
  <span id="{pin.root.id}-label" class="mb-2 block text-sm font-medium text-fg">{label}</span>
  <div {...pin.root} role="group" aria-labelledby="{pin.root.id}-label" class="flex justify-between gap-2">
    {#each pin.inputs as input, i (i)}
      <input
        {...input}
        aria-label="Digit {i + 1} of {length}"
        aria-invalid={error ? 'true' : undefined}
        autocomplete={i === 0 ? 'one-time-code' : 'off'}
        class="input h-14 w-full min-w-0 px-0 text-center font-mono text-2xl data-filled:border-accent"
      />
    {/each}
  </div>
  {#if error}<p class="mt-2 text-sm text-red-500">{error}</p>{/if}
</div>

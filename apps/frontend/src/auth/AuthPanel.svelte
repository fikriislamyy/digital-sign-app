<script lang="ts">
  const panels = [
    { image: '/auth/01.jpg', gradient: 'from-indigo-950 via-bg-deep to-black',
      line: 'Sign documents with cryptographic certainty.' },
    { image: '/auth/02.jpg', gradient: 'from-slate-900 via-bg-deep to-black',
      line: 'Every signature, permanently verifiable.' },
    { image: '/auth/03.jpg', gradient: 'from-zinc-900 via-bg-deep to-black',
      line: 'Built for teams that cannot afford a dispute.' },
  ];

  // A fresh pick per page load, as specified, so this is deliberately not
  // reactive. Only the image-failure flag below needs to be.
  const panel = panels[Math.floor(Math.random() * panels.length)];
  let imageFailed = $state(false);
</script>

<div class="relative h-full overflow-hidden bg-gradient-to-br {panel.gradient}" aria-hidden="true">
  {#if !imageFailed}
    <img
      src={panel.image}
      alt=""
      onerror={() => (imageFailed = true)}
      class="absolute inset-0 h-full w-full object-cover opacity-40"
    />
  {/if}

  <div class="absolute inset-0 bg-black/40"></div>

  <div class="relative flex h-full flex-col justify-between p-12">
    <span class="text-lg font-bold text-white">SignCraft</span>
    <p class="max-w-sm text-2xl font-semibold leading-snug text-white/90">{panel.line}</p>
  </div>
</div>

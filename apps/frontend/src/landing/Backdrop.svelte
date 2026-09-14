<!--
  Layer 1 base gradient, 2 noise, 3 floating blobs, 4 grid.
  Fixed and behind everything. Decorative, so hidden from assistive tech.
  Blobs are far weaker in light mode: pools of light do not read on white.
-->
<div class="noise pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
  <!-- 1. Base radial gradient -->
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#ffffff_0%,#fcfcfd_50%,#f4f5f8_100%)] dark:bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]"></div>

  <!-- 3. Animated gradient blobs -->
  <div class="absolute -top-[300px] left-1/2 h-[900px] w-[1400px] -translate-x-1/2 animate-float rounded-full bg-accent/[0.06] blur-[150px] dark:bg-accent/25"></div>
  <div class="absolute top-1/4 -left-[200px] h-[800px] w-[600px] animate-float rounded-full bg-fuchsia-500/[0.04] blur-[120px] [animation-delay:-3s] dark:bg-fuchsia-500/15"></div>
  <div class="absolute top-1/2 -right-[150px] h-[700px] w-[500px] animate-float rounded-full bg-indigo-500/[0.04] blur-[100px] [animation-delay:-6s] dark:bg-indigo-500/12"></div>
  <div class="absolute bottom-0 left-1/3 h-[600px] w-[800px] animate-pulse-glow rounded-full bg-accent/[0.03] blur-[130px] dark:bg-accent/10"></div>

  <!-- 4. Technical grid -->
  <div class="grid-overlay absolute inset-0 text-black opacity-[0.03] dark:text-white dark:opacity-[0.02]"></div>
</div>

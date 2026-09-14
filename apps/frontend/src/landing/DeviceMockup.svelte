<div class="relative mx-auto w-full max-w-3xl" aria-hidden="true">
  <!-- MacBook -->
  <div class="rounded-xl border border-gray-2 bg-slate-800 p-2.5 shadow-lg shadow-black/20">
    <div class="overflow-hidden rounded-lg bg-slate-950 aspect-[16/10]">
      <div class="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
        <span class="h-2.5 w-2.5 rounded-full bg-red-400/80"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-amber-400/80"></span>
        <span class="h-2.5 w-2.5 rounded-full bg-accent/80"></span>
      </div>
      <div class="space-y-3 p-5">
        <div class="h-2.5 w-1/3 rounded-full bg-gradient-to-r from-accent to-indigo-500"></div>
        <div class="h-2 w-3/4 rounded-full bg-white/10"></div>
        <div class="h-2 w-2/3 rounded-full bg-white/10"></div>
        <div class="mt-5 grid grid-cols-3 gap-3">
          {#each Array(3) as _}
            <div class="rounded-lg border border-white/5 bg-white/5 p-3">
              <div class="mb-2 h-6 w-6 rounded-lg bg-accent/20"></div>
              <div class="h-1.5 w-full rounded-full bg-white/10"></div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
  <div class="mx-auto h-2.5 w-1/3 rounded-b-lg bg-slate-300 dark:bg-slate-700"></div>

  <!-- iPhone -->
  <div class="absolute -bottom-8 -left-2 w-28 rounded-[1.5rem] border border-gray-2 bg-slate-800 p-1.5 shadow-lg shadow-black/20 sm:-left-10 sm:w-36">
    <div class="overflow-hidden rounded-[1.2rem] bg-slate-950 aspect-[9/19]">
      <div class="mx-auto mt-1.5 h-1 w-8 rounded-full bg-white/20"></div>
      <div class="space-y-2 p-3">
        <div class="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-accent to-indigo-500"></div>
        <div class="h-1.5 w-full rounded-full bg-white/10"></div>
        <div class="mt-3 rounded-lg border border-accent/20 bg-accent/10 p-2">
          <svg viewBox="0 0 100 30" class="w-full text-accent" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M4 22c10-14 16 4 24-6s12 10 22 0 16 4 24-4" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</div>

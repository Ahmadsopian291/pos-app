<!-- <script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()} -->

<!-- <script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()} -->

<script lang="ts">
  import './layout.css'; // <-- Titik satu artinya mencari file di folder yang sama
  let { children } = $props();
</script>

<div class="h-[100dvh] bg-gray-900 text-gray-800 flex justify-center">
  
  <div class="w-full max-w-md bg-gray-50 h-[100dvh] flex flex-col relative shadow-2xl overflow-hidden">
    
    <header class="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
      <h1 class="font-bold text-xl text-orange-600">Aplikasi Bican X Cique</h1>
      <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">
        BxC
      </div>
    </header>

    <main class="flex-1 p-4 pb-24 overflow-y-auto">
      
      {@render children()}

    </main>

    <nav class="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 pb-4 z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.03)]">
      
      <a href="/" class="flex flex-col items-center text-gray-400 hover:text-orange-600 focus:text-orange-600 p-2 transition">
        <span class="text-2xl mb-1">🛒</span>
        <span class="text-[10px] font-bold">Kasir</span>
      </a>

      <a href="/dapur" class="flex flex-col items-center text-gray-400 hover:text-orange-600 focus:text-orange-600 p-2 transition">
        <span class="text-2xl mb-1">🍳</span>
        <span class="text-[10px] font-bold">Dapur</span>
      </a>

      <a href="/gudang" class="flex flex-col items-center text-gray-400 hover:text-orange-600 focus:text-orange-600 p-2 transition">
        <span class="text-2xl mb-1">📦</span>
        <span class="text-[10px] font-bold">Gudang</span>
      </a>

      <a href="/laporan" class="flex flex-col items-center text-gray-400 hover:text-orange-600 focus:text-orange-600 p-2 transition">
        <span class="text-2xl mb-1">📊</span>
        <span class="text-[10px] font-bold">Laporan</span>
      </a>

    </nav>
    
  </div>
</div>
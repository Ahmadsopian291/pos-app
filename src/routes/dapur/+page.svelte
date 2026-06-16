<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let daftarBahan = $state<any[]>([]);
  let loading = $state(true);

  // Variabel untuk Tambah Bahan Baku Baru
  let namaBahan = $state('');
  let kategori = $state('Bahan Makanan');
  let satuan = $state(''); 
  let stok = $state<number | ''>('');
  let prosesSimpan = $state(false);

  // Variabel untuk Edit/Update Stok
  let tampilkanEdit = $state(false);
  let bahanTerpilih = $state<any>(null);
  let editStok = $state<number | ''>('');
  let prosesUpdate = $state(false);

  async function tarikData() {
    loading = true;
    const { data } = await supabase
      .from('bahan_baku')
      .select('*')
      .order('id', { ascending: false });
    
    if (data) daftarBahan = data;
    loading = false;
  }

  onMount(() => {
    tarikData();
  });

  async function simpanBahan() {
    if (!namaBahan || !kategori || !satuan || stok === '') {
      alert("Mohon isi semua data bahan baku!");
      return;
    }
    prosesSimpan = true;

    const { error } = await supabase
      .from('bahan_baku')
      .insert([{
        nama_bahan: namaBahan,
        kategori: kategori,
        satuan: satuan,
        stok_saat_ini: stok
      }]);

    if (error) {
      console.log("Detail Error:", error);
      alert("Gagal menyimpan bahan baku!");
    } else {
      alert("✅ Bahan baku berhasil ditambahkan ke dapur!");
      namaBahan = '';
      kategori = 'Bahan Makanan';
      satuan = '';
      stok = '';
      tarikData();
    }
    prosesSimpan = false;
  }

  async function perbaruiStok() {
    if (editStok === '' || !bahanTerpilih) return;
    prosesUpdate = true;

    const { error } = await supabase
      .from('bahan_baku')
      .update({ stok_saat_ini: editStok })
      .eq('id', bahanTerpilih.id);

    if (error) {
      alert("Gagal memperbarui stok!");
    } else {
      alert("✅ Stok bahan baku berhasil diperbarui!");
      tampilkanEdit = false;
      tarikData();
    }
    prosesUpdate = false;
  }

  function bukaEdit(bahan: any) {
    bahanTerpilih = bahan;
    editStok = bahan.stok_saat_ini;
    tampilkanEdit = true;
  }
</script>

<div class="mb-5">
  <h2 class="text-2xl font-extrabold text-gray-800">Dapur Produksi</h2>
  <p class="text-sm text-gray-500">Pantau stok bahan mentah sebelum kehabisan</p>
</div>

<div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
  <h3 class="font-bold text-gray-700 mb-3 border-b pb-2">Catat Bahan Mentah Baru</h3>
  
  <div class="flex flex-col gap-3">
    <div>
      <label for="dapur-nama" class="text-xs font-bold text-gray-500">NAMA BAHAN BAKU</label>
      <input id="dapur-nama" type="text" bind:value={namaBahan} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="Contoh: Tepung Aci / Daging Ayam">
    </div>

    <div>
      <label for="dapur-kategori" class="text-xs font-bold text-gray-500">KATEGORI BAHAN</label>
      <select id="dapur-kategori" bind:value={kategori} class="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-orange-500 outline-none">
        <option value="Bahan Makanan">Bahan Makanan</option>
        <option value="Packaging">Packaging</option>
      </select>
    </div>
    
    <div class="flex gap-3">
      <div class="flex-1">
        <label for="dapur-stok" class="text-xs font-bold text-gray-500">STOK AWAL</label>
        <input id="dapur-stok" type="number" bind:value={stok} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="10">
      </div>
      <div class="flex-1">
        <label for="dapur-satuan" class="text-xs font-bold text-gray-500">SATUAN</label>
        <input id="dapur-satuan" type="text" bind:value={satuan} list="daftar-satuan" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="kg, gram, pcs...">
        <datalist id="daftar-satuan">
          <option value="kg"></option>
          <option value="gram"></option>
          <option value="liter"></option>
          <option value="pcs"></option>
          <option value="pack"></option>
        </datalist>
      </div>
    </div>

    <button 
      onclick={simpanBahan}
      disabled={prosesSimpan}
      class="w-full mt-2 bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 transition hover:bg-black disabled:bg-gray-400 text-sm"
    >
      {prosesSimpan ? 'Menyimpan...' : '+ Tambah ke Dapur'}
    </button>
  </div>
</div>

<h3 class="font-bold text-gray-700 mb-3">Sisa Stok Bahan (Klik untuk Update)</h3>

{#if loading}
  <div class="flex justify-center py-10">
    <p class="text-gray-400 font-medium animate-pulse">Mengecek isi lemari es...</p>
  </div>
{:else}
  <div class="flex flex-col gap-2 pb-24">
    {#if daftarBahan.length === 0}
      <div class="bg-white p-5 rounded-xl border border-gray-100 text-center shadow-sm">
        <p class="text-gray-400 text-sm">Belum ada bahan baku yang dicatat.</p>
      </div>
    {:else}
      {#each daftarBahan as bahan}
        <button 
          onclick={() => bukaEdit(bahan)}
          class="bg-white p-3 rounded-xl border flex justify-between items-center shadow-sm text-left active:scale-98 transition group hover:border-orange-300 {bahan.stok_saat_ini <= 5 ? 'border-red-200 bg-red-50' : 'border-gray-100'}"
        >
          <div>
            <p class="font-bold text-sm text-gray-700 group-hover:text-orange-600 transition">{bahan.nama_bahan}</p>
            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full border {bahan.kategori === 'Bahan Makanan' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-purple-600 bg-purple-50 border-purple-100'}">
              {bahan.kategori}
            </span>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 font-medium mb-0.5">Sisa Stok</p>
            <p class="text-lg font-extrabold {bahan.stok_saat_ini <= 5 ? 'text-red-600' : 'text-gray-800'}">
              {bahan.stok_saat_ini} <span class="text-xs font-normal">{bahan.satuan}</span>
            </p>
          </div>
        </button>
      {/each}
    {/if}
  </div>
{/if}

{#if tampilkanEdit && bahanTerpilih}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0">
    <div class="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col shadow-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h3 class="font-bold text-lg text-gray-800">Update Stok Mentah</h3>
          <p class="text-xs text-gray-500">{bahanTerpilih.nama_bahan} ({bahanTerpilih.kategori})</p>
        </div>
        <button onclick={() => tampilkanEdit = false} class="w-8 h-8 bg-gray-200 rounded-full font-bold text-gray-500 active:scale-95">X</button>
      </div>

      <div class="mb-6">
        <label for="edit-stok-mentah" class="text-xs font-bold text-gray-500">SISA STOK SAAT INI ({bahanTerpilih.satuan.toUpperCase()})</label>
        <div class="flex items-center gap-2 mt-1">
          <input id="edit-stok-mentah" type="number" bind:value={editStok} class="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-700 focus:border-orange-500 outline-none text-xl">
          <span class="font-bold text-gray-400">{bahanTerpilih.satuan}</span>
        </div>
      </div>

      <div class="flex gap-2">
        <button onclick={() => tampilkanEdit = false} class="w-24 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:scale-95 text-sm">Batal</button>
        <button onclick={perbaruiStok} disabled={prosesUpdate} class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl active:scale-95 shadow-lg shadow-green-100 disabled:bg-gray-400 text-sm">
          {prosesUpdate ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  </div>
{/if}
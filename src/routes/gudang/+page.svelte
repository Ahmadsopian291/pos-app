<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let daftarProduk = $state<any[]>([]);
  let loading = $state(true);

  // Variabel Tambah
  let namaMenu = $state('');
  let kategori = $state(''); // Dikosongkan agar bisa diketik bebas
  let hargaJual = $state<number | ''>('');
  let stok = $state<number | ''>('');
  let prosesSimpan = $state(false);

  // Variabel Edit & Hapus
  let tampilkanEdit = $state(false);
  let produkTerpilih = $state<any>(null);
  let editHarga = $state<number | ''>('');
  let editStok = $state<number | ''>('');
  let prosesUpdate = $state(false);

  async function tarikData() {
    loading = true;
    const { data } = await supabase.from('produk_jual').select('*').order('id', { ascending: false });
    if (data) daftarProduk = data;
    loading = false;
  }

  onMount(() => tarikData());

  async function simpanProduk() {
    if (!namaMenu || !kategori || hargaJual === '' || stok === '') {
      alert("Mohon isi semua data menu terlebih dahulu!");
      return;
    }
    prosesSimpan = true;
    const { error } = await supabase.from('produk_jual').insert([{
      nama_menu: namaMenu, kategori: kategori, harga_jual: hargaJual, stok_siap_jual: stok
    }]);

    if (error) alert("Gagal menyimpan produk!");
    else {
      alert("✅ Menu baru berhasil ditambahkan!");
      namaMenu = ''; kategori = ''; hargaJual = ''; stok = '';
      tarikData();
    }
    prosesSimpan = false;
  }

  function bukaEdit(produk: any) {
    produkTerpilih = produk;
    editHarga = produk.harga_jual;
    editStok = produk.stok_siap_jual;
    tampilkanEdit = true;
  }

  async function perbaruiProduk() {
    if (editHarga === '' || editStok === '' || !produkTerpilih) return;
    prosesUpdate = true;
    const { error } = await supabase.from('produk_jual').update({
      harga_jual: editHarga, stok_siap_jual: editStok
    }).eq('id', produkTerpilih.id);

    if (error) alert("Gagal memperbarui data!");
    else {
      alert("✅ Data berhasil diperbarui!");
      tampilkanEdit = false;
      tarikData();
    }
    prosesUpdate = false;
  }

  // FUNGSI BARU: Hapus Produk
  async function hapusProduk() {
    const konfirmasi = confirm(`Yakin ingin menghapus ${produkTerpilih.nama_menu}?`);
    if (!konfirmasi) return;
    
    prosesUpdate = true;
    const { error } = await supabase.from('produk_jual').delete().eq('id', produkTerpilih.id);

    if (error) {
      alert("❌ Gagal menghapus! Produk ini mungkin sudah pernah terjual dan tercatat di riwayat struk. Ubah saja stoknya menjadi 0.");
    } else {
      alert("🗑️ Produk berhasil dihapus!");
      tampilkanEdit = false;
      tarikData();
    }
    prosesUpdate = false;
  }
</script>

<div class="mb-5">
  <h2 class="text-2xl font-extrabold text-gray-800">Gudang Stok</h2>
  <p class="text-sm text-gray-500">Manajemen data menu dan harga</p>
</div>

<div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
  <h3 class="font-bold text-gray-700 mb-3 border-b pb-2">Tambah Menu Baru</h3>
  <div class="flex flex-col gap-3">
    <div>
      <label for="input-nama" class="text-xs font-bold text-gray-500">NAMA MENU</label>
      <input id="input-nama" type="text" bind:value={namaMenu} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="Cireng Bumbu Rujak">
    </div>
    
    <div>
      <label for="input-kategori" class="text-xs font-bold text-gray-500">KATEGORI</label>
      <input id="input-kategori" type="text" bind:value={kategori} list="daftar-kategori" class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="Ketik baru atau pilih...">
      <datalist id="daftar-kategori">
        <option value="Cireng"></option>
        <option value="Dimsum"></option>
        <option value="Snack Lumer"></option>
        <option value="Minuman"></option>
      </datalist>
    </div>

    <div class="flex gap-3">
      <div class="flex-1">
        <label for="input-harga" class="text-xs font-bold text-gray-500">HARGA JUAL</label>
        <input id="input-harga" type="number" bind:value={hargaJual} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="15000">
      </div>
      <div class="flex-1">
        <label for="input-stok" class="text-xs font-bold text-gray-500">STOK AWAL</label>
        <input id="input-stok" type="number" bind:value={stok} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="50">
      </div>
    </div>
    <button onclick={simpanProduk} disabled={prosesSimpan} class="w-full mt-2 bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 hover:bg-black disabled:bg-gray-400">
      {prosesSimpan ? 'Menyimpan...' : '+ Simpan ke Database'}
    </button>
  </div>
</div>

<h3 class="font-bold text-gray-700 mb-3">Daftar Menu (Klik untuk Edit)</h3>
{#if loading}
  <div class="flex justify-center py-10"><p class="text-gray-400 font-medium animate-pulse">Menarik data dari gudang...</p></div>
{:else}
  <div class="flex flex-col gap-2 pb-24">
    {#each daftarProduk as produk}
      <button 
        onclick={() => bukaEdit(produk)}
        class="p-3 rounded-xl border flex justify-between items-center shadow-sm text-left active:scale-98 transition group {produk.stok_siap_jual <= 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-orange-300'}"
      >
        <div>
          <p class="font-bold text-sm {produk.stok_siap_jual <= 0 ? 'text-red-700' : 'text-gray-700 group-hover:text-orange-600'} transition">{produk.nama_menu}</p>
          <span class="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">{produk.kategori}</span>
        </div>
        <div class="text-right flex items-center gap-3">
          <div>
            <p class="text-sm font-extrabold {produk.stok_siap_jual <= 0 ? 'text-red-500' : 'text-orange-600'}">Rp {produk.harga_jual.toLocaleString('id-ID')}</p>
            <p class="text-xs font-medium {produk.stok_siap_jual <= 0 ? 'text-red-500 font-bold' : 'text-gray-500'}">Stok: <span>{produk.stok_siap_jual}</span></p>
          </div>
        </div>
      </button>
    {/each}
  </div>
{/if}

{#if tampilkanEdit && produkTerpilih}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0">
    <div class="bg-white w-full max-w-md rounded-t-3xl p-6 flex flex-col shadow-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <div>
          <h3 class="font-bold text-lg text-gray-800">Edit Data Produk</h3>
          <p class="text-xs text-gray-500">{produkTerpilih.nama_menu}</p>
        </div>
        <button onclick={() => tampilkanEdit = false} class="w-8 h-8 bg-gray-200 rounded-full font-bold text-gray-500 active:scale-95">X</button>
      </div>

      <div class="flex flex-col gap-4 mb-6">
        <div>
          <label for="edit-harga" class="text-xs font-bold text-gray-500">UBAH HARGA JUAL (Rp)</label>
          <input id="edit-harga" type="number" bind:value={editHarga} class="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-700 focus:border-orange-500 outline-none">
        </div>
        <div>
          <label for="edit-stok" class="text-xs font-bold text-gray-500">PERBARUI JUMLAH STOK</label>
          <input id="edit-stok" type="number" bind:value={editStok} class="w-full p-3 border border-gray-300 rounded-xl font-bold text-gray-700 focus:border-orange-500 outline-none">
        </div>
      </div>

      <div class="flex gap-2">
        <button onclick={hapusProduk} disabled={prosesUpdate} class="py-3 px-4 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-xl active:scale-95 transition disabled:opacity-50">
          🗑️
        </button>
        <button onclick={() => tampilkanEdit = false} class="w-20 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl active:scale-95">Batal</button>
        <button onclick={perbaruiProduk} disabled={prosesUpdate} class="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl active:scale-95 shadow-lg shadow-green-100 disabled:bg-gray-400">
          Simpan
        </button>
      </div>
    </div>
  </div>
{/if}
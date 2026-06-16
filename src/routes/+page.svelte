<!-- <h1>Welcome to SvelteKit</h1>
<h1 style="color: red;">wokwok</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p> -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  // 1. Data Menu dari Database
  let daftarMenu = $state<any[]>([]);
  let loading = $state(true);

  // 2. Data Keranjang Pesanan (Fitur Baru)
  let keranjang = $state<any[]>([]);

  // 3. Menghitung Total Harga Otomatis (Fitur Baru)
  // $derived artinya nilai ini akan otomatis menghitung ulang setiap kali isi keranjang berubah
  let totalHarga = $derived(
    keranjang.reduce((total, item) => total + (item.harga_jual * item.qty), 0)
  );

  // 4. Data Pembayaran (Fitur Baru)
  let tampilkanPembayaran = $state(false);
  let uangDibayar = $state<number | ''>(''); // Kosong pada awalnya
  
  // Menghitung kembalian otomatis. Jika uang kurang, hasilnya negatif (dilarang bayar)
  let kembalian = $derived((typeof uangDibayar === 'number' ? uangDibayar : 0) - totalHarga);

  // 5. Logika Proses Pembayaran (Fitur Baru)
  let prosesLoading = $state(false); // Untuk mencegah kasir memencet tombol 2 kali

  async function prosesPembayaran() {
    // Cegah jika uang kurang
    if (kembalian < 0 || uangDibayar === '') return;
    
    prosesLoading = true;

    // A. Simpan ke tabel 'transaksi' (Kertas Struk)
    const { data: dataTransaksi, error: errTransaksi } = await supabase
      .from('transaksi')
      .insert([{
        total_harga: totalHarga,
        uang_dibayar: typeof uangDibayar === 'number' ? uangDibayar : 0,
        kembalian: kembalian
      }])
      .select()
      .single();

    if (errTransaksi) {
      alert("Gagal mencatat transaksi!");
      prosesLoading = false;
      return;
    }

    // B. Simpan rincian ke 'detail_transaksi' & Kurangi Stok
    for (const item of keranjang) {
      // Catat rincian
      await supabase
        .from('detail_transaksi')
        .insert([{
          id_transaksi: dataTransaksi.id,
          id_produk: item.id,
          qty: item.qty,
          harga_satuan: item.harga_jual
        }]);

      // Kurangi stok di database
      const stokBaru = item.stok_siap_jual - item.qty;
      await supabase
        .from('produk_jual')
        .update({ stok_siap_jual: stokBaru })
        .eq('id', item.id);
    }

    // C. Transaksi Sukses! Bersihkan layar & segarkan stok
    alert("✅ Pembayaran Berhasil! Struk tercatat.");
    keranjang = []; // Kosongkan keranjang
    tampilkanPembayaran = false; // Tutup layar pop-up
    uangDibayar = ''; // Kosongkan input uang
    
    // Tarik ulang data dari database agar angka stok di layar langsung berkurang
    const { data } = await supabase
      .from('produk_jual')
      .select('*')
      .order('kategori', { ascending: true });
    if (data) daftarMenu = data;

    prosesLoading = false;
  }

  // Fungsi untuk mengambil data menu dari Supabase
  onMount(async () => {
    const { data, error } = await supabase
      .from('produk_jual')
      .select('*')
      .order('kategori', { ascending: true });

    if (data) {
      daftarMenu = data;
    }
    loading = false;
  });

  // Fungsi saat kasir memencet tombol menu (Fitur Baru)
  function tambahKeKeranjang(menu: any) {
    // Cek apakah menu ini sudah ada di keranjang?
    const indexAda = keranjang.findIndex((item) => item.id === menu.id);

    if (indexAda !== -1) {
      // Jika sudah ada, tambahkan jumlahnya (qty)
      keranjang[indexAda].qty += 1;
    } else {
      // Jika belum ada, masukkan ke keranjang dengan qty = 1
      // Gunakan sintaks penyebaran (...) untuk Svelte 5 reaktivitas
      keranjang = [...keranjang, { ...menu, qty: 1 }];
    }
  }

  // Fungsi untuk mengosongkan keranjang
  function batalkanPesanan() {
    keranjang = [];
  }
</script>

<div class="mb-5">
  <h2 class="text-2xl font-extrabold text-gray-800">Menu Kasir</h2>
  <p class="text-sm text-gray-500">Pilih menu pesanan pelanggan</p>
</div>

{#if loading}
  <div class="flex justify-center items-center py-20">
    <p class="text-orange-500 font-medium animate-pulse">Memuat menu dari dapur...</p>
  </div>
{:else}
  <div class="grid grid-cols-2 gap-3 pb-32">
    {#each daftarMenu as menu}
      <button 
        onclick={() => tambahKeKeranjang(menu)}
        disabled={menu.stok_siap_jual <= 0}
        class="p-3 rounded-2xl shadow-sm border flex flex-col text-left active:scale-95 transition-transform duration-100 
               {menu.stok_siap_jual <= 0 ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-orange-300'}"
      >
        
        <span class="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full w-max mb-2">
          {menu.kategori}
        </span>
        
        <span class="font-bold text-gray-700 leading-tight mb-3 flex-1">
          {menu.nama_menu}
        </span>
        
        <div class="flex justify-between items-end w-full">
          <span class="text-orange-600 font-extrabold text-sm">
            Rp {menu.harga_jual.toLocaleString('id-ID')}
          </span>
          <span class="text-[10px] font-semibold px-1.5 py-1 rounded-md 
            {menu.stok_siap_jual <= 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}">
            {menu.stok_siap_jual <= 0 ? 'HABIS' : `Stok: ${menu.stok_siap_jual}`}
          </span>
        </div>
        
      </button>
    {/each}
  </div>
{/if}

{#if keranjang.length > 0}
  <div class="fixed bottom-18 w-full max-w-md left-1/2 -translate-x-1/2 px-4 z-30">
    <div class="bg-gray-900 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 border border-gray-700">
      
      <div class="flex justify-between items-center text-white">
        <div class="flex flex-col">
          <span class="text-xs text-gray-400 font-medium">Total Pesanan</span>
          <span class="text-lg font-bold text-orange-400">Rp {totalHarga.toLocaleString('id-ID')}</span>
        </div>
        <div class="text-right">
          <span class="text-sm font-semibold">{keranjang.length} Macam Menu</span>
        </div>
      </div>

      <div class="flex gap-2">
        <button 
          onclick={batalkanPesanan}
          class="px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-semibold text-sm active:scale-95"
        >
          Batal
        </button>
        <button 
          onclick={() => tampilkanPembayaran = true}
          class="flex-1 bg-orange-600 text-white rounded-xl font-bold text-sm py-2 shadow-lg active:scale-95 flex justify-center items-center gap-2"
        >
          <span>Lanjut Bayar</span>
          <span class="text-lg">➔</span>
        </button>
      </div>

    </div>
  </div>
{/if}

{#if tampilkanPembayaran}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div class="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden transition-transform">
      
      <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 class="font-bold text-lg text-gray-800">Checkout Pesanan</h3>
        <button onclick={() => tampilkanPembayaran = false} class="w-8 h-8 bg-gray-200 rounded-full font-bold text-gray-500 active:scale-95 hover:bg-gray-300 transition">X</button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-5">
        <h4 class="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Rincian Belanja</h4>
        {#each keranjang as item}
          <div class="flex justify-between items-center mb-3">
            <div class="flex flex-col">
              <span class="font-bold text-gray-700">{item.nama_menu}</span>
              <span class="text-xs text-gray-500">{item.qty} x Rp {item.harga_jual.toLocaleString('id-ID')}</span>
            </div>
            <span class="font-bold text-gray-800">Rp {(item.qty * item.harga_jual).toLocaleString('id-ID')}</span>
          </div>
        {/each}
      </div>

      <div class="p-5 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <span class="font-bold text-gray-600">Total Tagihan</span>
          <span class="text-2xl font-extrabold text-orange-600">Rp {totalHarga.toLocaleString('id-ID')}</span>
        </div>
        
        <label for="input-uang" class="block text-xs font-bold text-gray-500 mb-2">UANG DITERIMA DARI PELANGGAN</label>
        <input 
          id="input-uang"
          type="number" 
          bind:value={uangDibayar} 
          class="w-full text-xl font-bold p-3 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition bg-white"
          placeholder="Ketik jumlah uang (misal: 50000)"
        >

        <div class="flex justify-between items-center mb-6">
          <span class="font-bold text-gray-600">Uang Kembalian</span>
          <span class="text-xl font-bold {kembalian >= 0 ? 'text-green-600' : 'text-red-500'}">
            {kembalian >= 0 ? `Rp ${kembalian.toLocaleString('id-ID')}` : 'Uang Kurang!'}
          </span>
        </div>

        <button 
          onclick={prosesPembayaran}
          disabled={kembalian < 0 || uangDibayar === '' || prosesLoading}
          class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition active:scale-95 {kembalian >= 0 && uangDibayar !== '' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}"
        >
          {prosesLoading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
        </button>
      </div>

    </div>
  </div>
{/if}
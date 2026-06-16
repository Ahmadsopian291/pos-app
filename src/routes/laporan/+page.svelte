<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  // Data dari Database
  let riwayatTransaksi = $state<any[]>([]);
  let riwayatPengeluaran = $state<any[]>([]);
  let loading = $state(true);

  // Navigasi Tab (jualan / pengeluaran)
  let tabAktif = $state<'jualan' | 'pengeluaran'>('jualan');

  // Variabel Input Pengeluaran Baru
  let tampilkanFormPengeluaran = $state(false);
  let keteranganBaru = $state('');
  let nominalBaru = $state<number | ''>('');
  let prosesSimpan = $state(false);

  // Variabel Rincian Struk Jualan (Fitur Sebelumnya)
  let tampilkanDetail = $state(false);
  let strukTerpilih = $state<any>(null);
  let isiStruk = $state<any[]>([]);
  let loadingDetail = $state(false);

  // Kalkulator Finansial Otomatis
  let totalPendapatan = $derived(riwayatTransaksi.reduce((total, trx) => total + trx.total_harga, 0));
  let totalPengeluaran = $derived(riwayatPengeluaran.reduce((total, pgl) => total + pgl.nominal, 0));
  let labaBersih = $derived(totalPendapatan - totalPengeluaran);

  // Fungsi mengambil semua data finansial
  async function tarikSemuaData() {
    loading = true;
    
    // A. Ambil Data Penjualan
    const { data: dataJualan } = await supabase
      .from('transaksi')
      .select('*')
      .order('waktu_transaksi', { ascending: false });
    if (dataJualan) riwayatTransaksi = dataJualan;

    // B. Ambil Data Pengeluaran
    const { data: dataPengeluaran } = await supabase
      .from('pengeluaran')
      .select('*')
      .order('waktu_pengeluaran', { ascending: false });
    if (dataPengeluaran) riwayatPengeluaran = dataPengeluaran;

    loading = false;
  }

  onMount(() => {
    tarikSemuaData();
  });

  // Fungsi Menyimpan Pengeluaran Baru
  async function simpanPengeluaran() {
    if (!keteranganBaru || nominalBaru === '') {
      alert("Mohon isi keterangan dan nominal pengeluaran!");
      return;
    }
    prosesSimpan = true;

    const { error } = await supabase
      .from('pengeluaran')
      .insert([{
        keterangan: keteranganBaru,
        nominal: nominalBaru
      }]);

    if (error) {
      alert("Gagal mencatat pengeluaran!");
    } else {
      alert("✅ Pengeluaran berhasil dicatat!");
      keteranganBaru = '';
      nominalBaru = '';
      tampilkanFormPengeluaran = false;
      tarikSemuaData(); // Segarkan data angka di layar
    }
    prosesSimpan = false;
  }

  // Fungsi membuka rincian struk jualan
  async function bukaDetail(trx: any) {
    strukTerpilih = trx;
    tampilkanDetail = true;
    loadingDetail = true;
    isiStruk = [];
    const { data } = await supabase
      .from('detail_transaksi')
      .select('qty, harga_satuan, produk_jual ( nama_menu )')
      .eq('id_transaksi', trx.id);
    if (data) isiStruk = data;
    loadingDetail = false;
  }

  function formatTanggal(waktu: string) {
    return new Date(waktu).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="mb-4">
  <h2 class="text-2xl font-extrabold text-gray-800">Laporan Keuangan</h2>
  <p class="text-sm text-gray-500">Pantau omzet, biaya, dan keuntungan bersih</p>
</div>

{#if loading}
  <div class="flex justify-center py-10">
    <p class="text-gray-400 font-medium animate-pulse">Menghitung pembukuan toko...</p>
  </div>
{:else}
  <div class="grid grid-cols-2 gap-2 mb-3">
    <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
      <p class="text-[10px] font-bold text-gray-400 uppercase">Omzet Jualan</p>
      <p class="text-sm font-extrabold text-orange-600 mt-1">Rp {totalPendapatan.toLocaleString('id-ID')}</p>
    </div>
    <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
      <p class="text-[10px] font-bold text-gray-400 uppercase">Total Biaya Out</p>
      <p class="text-sm font-extrabold text-red-500 mt-1">Rp {totalPengeluaran.toLocaleString('id-ID')}</p>
    </div>
  </div>

  <div class="p-4 rounded-xl text-white shadow-lg mb-5 transition-colors {labaBersih >= 0 ? 'bg-linear-to-br from-green-600 to-emerald-700 shadow-green-100' : 'bg-linear-to-br from-red-600 to-rose-700 shadow-red-100'}">
    <p class="text-emerald-100 text-xs font-medium">Estimasi Laba Bersih</p>
    <h3 class="text-2xl font-extrabold mt-0.5">Rp {labaBersih.toLocaleString('id-ID')}</h3>
  </div>

  <div class="flex bg-gray-200 p-1 rounded-xl mb-4 text-xs font-bold">
    <button onclick={() => tabAktif = 'jualan'} class="flex-1 py-2 rounded-lg transition {tabAktif === 'jualan' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}">
      🛒 Uang Masuk ({riwayatTransaksi.length})
    </button>
    <button onclick={() => tabAktif = 'pengeluaran'} class="flex-1 py-2 rounded-lg transition {tabAktif === 'pengeluaran' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}">
      💸 Uang Keluar ({riwayatPengeluaran.length})
    </button>
  </div>

  <div class="flex flex-col gap-2 pb-24">
    
    {#if tabAktif === 'jualan'}
      {#if riwayatTransaksi.length === 0}
        <p class="text-center text-xs text-gray-400 py-10">Belum ada jualan hari ini.</p>
      {:else}
        {#each riwayatTransaksi as trx}
          <button onclick={() => bukaDetail(trx)} class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1 text-left active:scale-98 transition w-full hover:border-orange-200">
            <div class="flex justify-between items-center w-full text-[10px] text-gray-400 font-medium">
              <span>{formatTanggal(trx.waktu_transaksi)}</span>
              <span class="text-blue-500 font-bold">Detail ➔</span>
            </div>
            <p class="text-base font-extrabold text-gray-800">Rp {trx.total_harga.toLocaleString('id-ID')}</p>
          </button>
        {/each}
      {/if}

    {:else}
      <button onclick={() => tampilkanFormPengeluaran = true} class="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition mb-2">
        + Catat Pengeluaran Baru
      </button>

      {#if riwayatPengeluaran.length === 0}
        <p class="text-center text-xs text-gray-400 py-10">Belum ada catatan pengeluaran.</p>
      {:else}
        {#each riwayatPengeluaran as pgl}
          <div class="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p class="font-bold text-sm text-gray-700">{pgl.keterangan}</p>
              <p class="text-[10px] text-gray-400">{formatTanggal(pgl.waktu_pengeluaran)}</p>
            </div>
            <p class="font-extrabold text-sm text-red-500">- Rp {pgl.nominal.toLocaleString('id-ID')}</p>
          </div>
        {/each}
      {/if}
    {/if}

  </div>
{/if}

{#if tampilkanFormPengeluaran}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0">
    <div class="bg-white w-full max-w-md rounded-t-3xl p-5 flex flex-col shadow-2xl border border-gray-200">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h3 class="font-bold text-lg text-gray-800">Catat Uang Keluar</h3>
        <button onclick={() => tampilkanFormPengeluaran = false} class="w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-500 active:scale-95">X</button>
      </div>

      <div class="flex flex-col gap-3 mb-5">
        <div>
          <label for="out-keterangan" class="text-xs font-bold text-gray-400">KETERANGAN OPERASIONAL</label>
          <input id="out-keterangan" type="text" bind:value={keteranganBaru} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="Contoh: Beli Gas Elpiji 3kg / Isi bensin kurir">
        </div>
        <div>
          <label for="out-nominal" class="text-xs font-bold text-gray-400">NOMINAL UANG KELUAR (Rp)</label>
          <input id="out-nominal" type="number" bind:value={nominalBaru} class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-orange-500 outline-none" placeholder="22000">
        </div>
      </div>

      <div class="flex gap-2">
        <button onclick={() => tampilkanFormPengeluaran = false} class="w-20 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-xs active:scale-95">Batal</button>
        <button onclick={simpanPengeluaran} disabled={prosesSimpan} class="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs active:scale-95 shadow-lg shadow-red-100 disabled:bg-gray-400">
          {prosesSimpan ? 'Menyimpan...' : 'Simpan Pengeluaran'}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if tampilkanDetail && strukTerpilih}
  <div class="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0">
    <div class="bg-white w-full max-w-md h-[65vh] rounded-t-3xl p-5 flex flex-col shadow-2xl border border-gray-200 relative">
      <button onclick={() => tampilkanDetail = false} class="absolute top-4 right-4 w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-500 active:scale-95">X</button>
      <div class="mb-4 text-center border-b border-dashed border-gray-300 pb-3">
        <h3 class="font-extrabold text-lg text-gray-800">Detail Order</h3>
        <p class="text-xs text-gray-500 mt-0.5">{formatTanggal(strukTerpilih.waktu_transaksi)}</p>
      </div>
      <div class="flex-1 overflow-y-auto">
        {#if loadingDetail}
          <p class="text-center text-xs text-gray-400 animate-pulse mt-10">Mengambil catatan pesanan...</p>
        {:else}
          <ul class="flex flex-col gap-2">
            {#each isiStruk as item}
              <li class="flex justify-between items-center text-xs">
                <div>
                  <p class="font-bold text-gray-700">{item.produk_jual?.nama_menu || 'Produk Dihapus'}</p>
                  <p class="text-[10px] text-gray-500">{item.qty} x Rp {item.harga_satuan.toLocaleString('id-ID')}</p>
                </div>
                <p class="font-bold text-gray-800">Rp {(item.qty * item.harga_satuan).toLocaleString('id-ID')}</p>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="mt-3 pt-3 border-t border-dashed border-gray-300 flex flex-col gap-1 text-xs">
        <div class="flex justify-between"><span class="text-gray-500">Total Belanja</span><span class="font-bold text-gray-800">Rp {strukTerpilih.total_harga.toLocaleString('id-ID')}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Tunai</span><span class="font-bold text-gray-800">Rp {strukTerpilih.uang_dibayar.toLocaleString('id-ID')}</span></div>
        <div class="flex justify-between"><span class="text-gray-500">Kembalian</span><span class="font-bold text-gray-800">Rp {strukTerpilih.kembalian.toLocaleString('id-ID')}</span></div>
      </div>
    </div>
  </div>
{/if}
/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event: any) => {
  // Simpan semua file aplikasi ke memori HP saat pertama kali dibuka
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }
  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event: any) => {
  // Hapus cache lama jika ada update aplikasi (misal kamu mengubah kode)
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }
  event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event: any) => {
  // Jika metode bukan GET, hiraukan (biarkan Supabase tetap mengurus POST/UPDATE secara online)
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // Jika file ada di memori HP (HTML, CSS, Gambar), langsung pakai itu agar instan!
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(event.request.url);
      if (response) return response;
    }

    // Jika tidak ada di memori, coba ambil dari internet
    try {
      const response = await fetch(event.request);
      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      // Jika internet putus, coba cari cadangan terakhir di memori
      return cache.match(event.request);
    }
  }
  event.respondWith(respond());
});
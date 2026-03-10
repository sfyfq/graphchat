import { get, set, del } from 'idb-keyval'

/**
 * Save a binary blob to IndexedDB.
 */
export async function saveBlob(id: string, blob: Blob): Promise<void> {
  await set(`blob:${id}`, blob)
}

/**
 * Retrieve a binary blob from IndexedDB.
 */
export async function getBlob(id: string): Promise<Blob | undefined> {
  return await get(`blob:${id}`)
}

/**
 * Delete a binary blob from IndexedDB.
 */
export async function deleteBlob(id: string): Promise<void> {
  await del(`blob:${id}`)
}

/**
 * Get a temporary URL for a blob.
 */
export async function getBlobUrl(id: string): Promise<string | null> {
  const blob = await getBlob(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

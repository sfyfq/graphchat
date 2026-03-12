import { get, set, del } from 'idb-keyval'

/**
 * Save a binary blob to IndexedDB, scoped by user.
 */
export async function saveBlob(scope: string, id: string, blob: Blob): Promise<void> {
  await set(`blob:${scope}:${id}`, blob)
}

/**
 * Retrieve a binary blob from IndexedDB, scoped by user.
 */
export async function getBlob(scope: string, id: string): Promise<Blob | undefined> {
  return await get(`blob:${scope}:${id}`)
}

/**
 * Delete a binary blob from IndexedDB, scoped by user.
 */
export async function deleteBlob(scope: string, id: string): Promise<void> {
  await del(`blob:${scope}:${id}`)
}

/**
 * Get a temporary URL for a scoped blob.
 */
export async function getBlobUrl(scope: string, id: string): Promise<string | null> {
  const blob = await getBlob(scope, id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

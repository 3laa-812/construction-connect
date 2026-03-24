import type { Database } from '@nozbe/watermelondb'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'
import LogPhoto from '../db/models/LogPhoto'
import api from './api'

const MAX_BYTES = 500 * 1024

async function compressToUnderLimit(uri: string): Promise<string> {
  let quality = 0.85
  let out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
  )

  for (let i = 0; i < 8; i++) {
    const info = await FileSystem.getInfoAsync(out.uri)
    const size =
      info.exists && 'size' in info && typeof (info as { size?: number }).size === 'number'
        ? (info as { size: number }).size
        : 0
    if (size <= MAX_BYTES || quality <= 0.35) {
      return out.uri
    }
    quality -= 0.08
    out = await ImageManipulator.manipulateAsync(out.uri, [], {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    })
  }
  return out.uri
}

/** After sync push, upload local site photos to S3 and persist public URLs on each record. */
export async function uploadPendingPhotos(database: Database): Promise<void> {
  const collection = database.get<LogPhoto>('log_photos')
  const all = await collection.query().fetch()
  const pending = all.filter((p) => !p.s3Url && p.localPath)

  for (const photo of pending) {
    const rawPath = photo.localPath
    if (!rawPath) continue
    try {
      const uri = await compressToUnderLimit(rawPath)
      const formData = new FormData()
      formData.append('log_photo_id', photo.id)
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any)

      const res = await api.post('/daily-logs/photos', formData)
      const url = res.data?.url
      if (url) {
        await database.write(async () => {
          await photo.update((p) => {
            p.s3Url = url
          })
        })
      }
    } catch (e) {
      console.warn('photo upload failed', photo.id, e)
    }
  }
}

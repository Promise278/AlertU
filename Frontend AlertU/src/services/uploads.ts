import { api } from '../lib/api'

interface UploadSignatureResponse {
  data: {
    cloudName: string
    apiKey: string
    timestamp: number
    folder: string
    allowedFormats: string
    signature: string
  }
}

interface CloudinaryUploadResponse {
  secure_url?: string
  error?: { message?: string }
}

export async function uploadReportImage(file: File): Promise<string> {
  const { data } = await api<UploadSignatureResponse>('/uploads/signature', {
    method: 'POST',
    body: {},
  })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', data.apiKey)
  formData.append('timestamp', String(data.timestamp))
  formData.append('folder', data.folder)
  formData.append('allowed_formats', data.allowedFormats)
  formData.append('signature', data.signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(data.cloudName)}/image/upload`,
    { method: 'POST', body: formData },
  )

  const payload = (await response.json()) as CloudinaryUploadResponse
  if (!response.ok || !payload.secure_url) {
    throw new Error(
      payload.error?.message || 'An image could not be uploaded. Please try again.',
    )
  }

  return payload.secure_url
}

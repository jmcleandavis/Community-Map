// Returns { url, publicId } — publicId is needed for server-side deletion
export async function uploadImageToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id }
}

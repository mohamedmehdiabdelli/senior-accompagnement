# Image Pipeline Audit

## 1. Image Capture / Selection

**Files:** `src/pages/AddClothing.tsx` and `src/pages/Wardrobe.tsx`

Both use an identical pattern. The state variables holding the image:

| File | Raw File | Base64 Preview |
|------|----------|----------------|
| `AddClothing.tsx:24-26` | `const [photoFile, setPhotoFile] = useState<File\|null>(null)` | `const [photoPreview, setPhotoPreview] = useState('')` |
| `Wardrobe.tsx:32-36` | `const [scanFile, setScanFile] = useState<File\|null>(null)` | `const [scanPreview, setScanPreview] = useState('')` |

The HTML input:
```tsx
<input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
```

The `File` is converted to Base64 **only for the live preview** via a `FileReader` effect:
```ts
// AddClothing.tsx:30-45
useEffect(() => {
  if (!photoFile) { setPhotoPreview(''); return; }
  const reader = new FileReader();
  reader.onload = () => { setPhotoPreview(reader.result as string); };
  reader.readAsDataURL(photoFile);
  return () => { reader.abort(); };
}, [photoFile]);
```

---

## 2. Compression Check

**There is zero frontend compression.** No `browser-image-compression`, no canvas resizing, no downscaling. The raw `File` object (whatever the camera or file picker produces — often 3–12 MB) is kept intact in `photoFile` / `scanFile` and sent as-is.

---

## 3. Hugging Face Payload

**The image is sent as raw binary inside `FormData`.** The `Content-Type` header is omitted, so the browser auto-sets `multipart/form-data`.

`AddClothing.tsx:54-85`:
```ts
const formData = new FormData();
formData.append('file', file);               // ← raw File, no transformation
formData.append('resident_name', residentName);
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

`Wardrobe.tsx:73-103` — identical pattern:
```ts
const formData = new FormData();
formData.append('file', file);
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData
});
```

Neither endpoint uses Base64, JSON-encoded binary, or any pre-processing.

---

## 4. Supabase Storage

**The image is NOT uploaded to Supabase Storage at runtime.** The function `uploadClothingImage()` exists in `src/lib/db.ts:291-318` and is correctly wired to the `clothing-images` bucket:

```ts
export async function uploadClothingImage(file: File, ownerId: string): Promise<string> {
  const bucket = 'clothing-images';
  const filePath = `${ownerId}/${crypto.randomUUID()}-${file.name}`;
  await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '3600', upsert: false });
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
```

**However**, it is **imported but never called** in `AddClothing.tsx:6`. Instead, the app relies on the Hugging Face Space to return an `image_url` (or falls back to the local Base64 `photoPreview`). That URL is then saved directly into the `clothing_items.image_url` column (a plain `text` field) in the Supabase database:

```sql
-- supabase_schema.sql
create table clothing_items (
  ...
  image_url text default '',
  ...
);
```

So the flow is:

```
Camera → File → FormData → Hugging Face Space → returns image_url → saved to DB column
```

No Supabase Storage bucket is used in production, even though the code for it exists.

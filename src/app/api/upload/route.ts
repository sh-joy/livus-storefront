import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import { getAdminSession } from '@/lib/admin-guard';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
// Vercel rejects request bodies over ~4.5 MB, so keep each file under that.
// The admin page resizes big photos in the browser before sending them.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Admin-only product image upload.
 * - With BLOB_READ_WRITE_TOKEN set (Vercel Blob store connected): files go to Vercel Blob
 *   and permanent https://…blob.vercel-storage.com URLs are returned. Required in production,
 *   because Vercel can't keep files written to its own disk.
 * - Without it (local development): files are saved to public/uploads/products as before.
 */
export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!useBlob && process.env.VERCEL) {
    return NextResponse.json(
      { success: false, message: 'Image storage is not set up. Connect a Vercel Blob store to this project.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }

    // Validate everything first so a bad file doesn't leave a half-finished upload behind.
    for (const file of files) {
      const ext = (path.extname(file.name) || '.jpg').toLowerCase();
      if (!ALLOWED_EXT.has(ext) || !file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: `Only image files are allowed (${file.name})` }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, message: `${file.name} is larger than 4 MB` }, { status: 400 });
      }
    }

    const savedUrls: string[] = [];

    for (const file of files) {
      const ext = (path.extname(file.name) || '.jpg').toLowerCase();
      const cleanName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60) || 'image';

      if (useBlob) {
        const blob = await put(`products/${cleanName}${ext}`, file, {
          access: 'public',
          addRandomSuffix: true,
          contentType: file.type,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        });
        savedUrls.push(blob.url);
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        await mkdir(uploadDir, { recursive: true });
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${cleanName}${ext}`;
        await writeFile(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
        savedUrls.push(`/uploads/products/${fileName}`);
      }
    }

    return NextResponse.json({ success: true, urls: savedUrls });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed. Please try again.' }, { status: 500 });
  }
}

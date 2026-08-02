import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${Date.now()}_${i}_${cleanName}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      savedUrls.push(`/uploads/products/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      urls: savedUrls,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}

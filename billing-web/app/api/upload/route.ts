import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { getStaffSession } from '@/lib/auth/staffSession';
import { checkRateLimit } from '@/lib/rateLimit';
import { log } from '@/lib/logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Multipart framing adds a little on top of the file itself.
const MAX_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024;
// Stored images are capped at this size on each side — logos/menu photos never need more, and it
// bounds storage per upload regardless of what was sent.
const MAX_DIMENSION = 2000;
// Per staff user: generous for bulk-adding a menu, but stops scripted storage abuse.
const UPLOAD_LIMIT = 60;
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;

// Detects the real image type from the file's first bytes. The browser-supplied `file.type` is
// just a client claim — a renamed HTML/SVG/executable labelled image/png would pass a MIME check.
function sniffImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Staff only (product images, tenant logo, customer photo, website builder assets all live in
    // the authenticated staff area). Previously any session — including a storefront *customer*
    // login — could upload, which made this an open storage relay.
    const staff = await getStaffSession();
    if (!staff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(`upload:${staff.userId}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many uploads. Please wait a few minutes and try again.' }, { status: 429 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      log.error('upload.not_configured');
      return NextResponse.json({ error: 'Upload service not configured' }, { status: 503 });
    }

    // Reject oversized bodies BEFORE parsing — req.formData() buffers the entire body in memory,
    // so checking file.size afterwards still let a huge POST exhaust server memory.
    const contentLength = Number(req.headers.get('content-length'));
    if (!Number.isFinite(contentLength) || contentLength <= 0) {
      return NextResponse.json({ error: 'Content-Length is required' }, { status: 411 });
    }
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = sniffImageType(buffer);
    if (!detectedType) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 400 });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Per-tenant folder: keeps tenants' assets separable (cleanup, export, abuse triage).
          folder: `billing_app_uploads/${staff.tenantId}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          // Never keep the client's filename (path tricks, PII in names) — Cloudinary generates one.
          use_filename: false,
          unique_filename: true,
          // Downscale on ingest so stored originals are bounded.
          transformation: [{ width: MAX_DIMENSION, height: MAX_DIMENSION, crop: 'limit' }],
        },
        (error, uploaded) => {
          if (error) reject(error);
          else if (!uploaded) reject(new Error('Upload returned no result'));
          else resolve(uploaded);
        }
      );
      uploadStream.end(buffer);
    });

    // CDN delivery URL with automatic format (WebP/AVIF where supported) and quality — typically a
    // large byte saving for menu photos, cached at Cloudinary's edge.
    const url = cloudinary.url(result.public_id, {
      secure: true,
      version: result.version,
      fetch_format: 'auto',
      quality: 'auto',
    });

    log.info('upload.ok', { tenantId: staff.tenantId, bytes: buffer.length, type: detectedType, width: result.width, height: result.height });
    return NextResponse.json({ url });
  } catch (error) {
    // The provider's raw error text used to be returned to the client; keep it in logs only.
    log.error('upload.failed', { error });
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 502 });
  }
}

import fs from 'fs/promises';
import path from 'path';
import { db } from '@rumbo/db';

// Storage root — override via STORAGE_ROOT env var.
// Seam: swap getBackend() for an S3 adapter without changing callers.

function storageRoot() {
  return process.env.STORAGE_ROOT
    ?? path.join(process.cwd(), 'storage');
}

// ---- Write artifact ----
// Writes content (string or Buffer) to a relative path inside the storage root.
// Records an ArtifactManifest row and returns it.

export async function writeArtifact({ jobId = null, type, relativePath, content, mimeType = 'application/json', meta = {} }) {
  const fullPath = path.join(storageRoot(), relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content;
  await fs.writeFile(fullPath, buf);

  const manifest = await db.artifactManifest.create({
    data: {
      jobId,
      type,
      storagePath: relativePath,
      sizeBytes:   buf.byteLength,
      mimeType,
      meta,
    },
  });

  return manifest;
}

// ---- Read artifact ----

export async function readArtifact(storagePath) {
  const fullPath = path.join(storageRoot(), storagePath);
  return fs.readFile(fullPath, 'utf8');
}

// ---- Read artifact as JSON ----

export async function readArtifactJson(storagePath) {
  const raw = await readArtifact(storagePath);
  return JSON.parse(raw);
}

// ---- Delete artifact ----

export async function deleteArtifact(storagePath) {
  const fullPath = path.join(storageRoot(), storagePath);
  await fs.unlink(fullPath).catch(() => {}); // ignore if already gone
  await db.artifactManifest.deleteMany({ where: { storagePath } });
}

// ---- Path helpers ----
// Consistent path convention: {type}/{jobId}/{filename}

export function artifactPath(type, jobId, filename) {
  return path.join(type, jobId, filename);
}

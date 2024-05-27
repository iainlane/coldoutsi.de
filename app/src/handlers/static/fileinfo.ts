import { createHash } from "crypto";
import { readFile, readdir, stat } from "fs/promises";
import { contentType } from "mime-types";
import * as path from "path";
import { fileURLToPath } from "url";

export interface staticFileInfo {
  buffer: Buffer;
  etag: string;
  lastModified: Date;
  contentType: string;
  size: number;
}

/**
 * Precompute file data for a directory of static files. This is useful to avoid
 * reading files on every request.
 *
 * @param dir Directory to read files from
 * @returns Object containing file data
 */
export async function precomputeFileData(dir: string) {
  const fileInfo: { [path: string]: staticFileInfo } = {};

  const files = await readdir(dir, { withFileTypes: true });

  await Promise.all(
    files.map(async (dirent) => {
      const dir = dirent.parentPath;
      const filePath = path.join(dir, dirent.name);
      const fileBuffer = await readFile(filePath);
      const hashSum = createHash("sha256").update(fileBuffer).digest("hex");

      const stats = await stat(filePath);
      const lastModified = stats.mtime;
      // HTTP timestamps can't have milliseconds
      lastModified.setMilliseconds(0);

      const fileContentType =
        contentType(path.extname(dirent.name)) || "application/octet-stream";

      fileInfo[dirent.name] = {
        buffer: fileBuffer,
        contentType: fileContentType,
        etag: `"${hashSum}"`,
        lastModified: lastModified,
        size: stats.size,
      };
    }),
  );

  return fileInfo;
}

// Read all files from `/static` and precompute their metadata.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticFilesDir = path.resolve(__dirname, "../../../static");

export const staticFileData = await precomputeFileData(staticFilesDir);

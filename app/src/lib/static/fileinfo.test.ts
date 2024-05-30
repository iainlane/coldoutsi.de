import { describe, expect, it } from "@jest/globals";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

import { precomputeFileData } from "./fileinfo";

describe("precomputeFileData", () => {
  it("returns correct file data", async () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const staticFilesDir = path.join(__dirname, "..", "..", "testdata");
    const fileData = await precomputeFileData(staticFilesDir);

    const text = "test\n";
    const sha256 = createHash("sha256").update(text).digest("hex");

    expect(fileData).toEqual({
      "test.txt": {
        buffer: Buffer.from(text),
        contentType: "text/plain; charset=utf-8",
        etag: `"${sha256}"`,
        hash: sha256,
        lastModified: expect.anything(),
        size: 5,
      },
    });
  });
});

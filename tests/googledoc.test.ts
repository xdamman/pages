import { isPublished, downloadGoogleDoc } from "../lib/googledoc.ts";
import { assertEquals } from "jsr:@std/assert";
import { loadCredentials, authorize } from "../lib/googleapi.ts";
import { expect } from "jsr:@std/expect/expect";
const unpublishedGoogleDocId = "1DiVM5-8WZMAk00pMIHlcLQfnmSWXKxI2uzEAD5klNH4";
const publishedGoogleDocId = "1kORlg-Sd5JY-HkmUoaxE_3tDwTKSK9dDcHYa14bkbAw";
const testGoogleDocId = "1mCjheAOEicVAfuR1bBUF6YDVTX5kX9mnAn8nrmbUgxs";

Deno.test("is published?", async () => {
  assertEquals(await isPublished(unpublishedGoogleDocId), false);
  assertEquals(await isPublished(publishedGoogleDocId), true);
});

Deno.test("download", async () => {
  const credentials = await loadCredentials();
  const auth = await authorize(credentials);

  const res = await downloadGoogleDoc(auth, testGoogleDocId, "./tests/output");
  console.log(res);
  expect(res.length).toBe(5);
});

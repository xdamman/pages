import slugify from "npm:slugify@1.6.6";
import path from "npm:path";
import { extractImagesFromMarkdown } from "./markdown.ts";
import { getGoogleDocContent } from "./googleapi.ts";
export async function isPublished(googleDocId: string) {
  const url = `https://docs.google.com/document/d/${googleDocId}/pub`;
  const response = await fetch(url);
  await response.body?.cancel();
  return response.status === 200;
}

type Element = {
  inlineObjectElement: { inlineObjectId: string };
};

export async function downloadGoogleDoc(
  auth: any,
  googleDocId: string,
  downloadPath: string
): Promise<string[]> {
  if (!(await isPublished(googleDocId))) {
    console.log(`Skipping ${googleDocId} because it is not published`);
    return [];
  }

  try {
    Deno.mkdirSync(downloadPath, { recursive: true });
  } catch (e) {}

  const data = await getGoogleDocContent(auth, googleDocId);
  const name = data?.title || googleDocId;
  const downloadedFiles: string[] = [];
  const inlineObjectElements: string[] = [];
  data?.body.content.forEach(
    (block: { paragraph: { elements: Element[] } }) => {
      if (!block.paragraph?.elements?.length) {
        return;
      }
      block.paragraph.elements.forEach((element: Element) => {
        if (element.inlineObjectElement) {
          inlineObjectElements.push(element.inlineObjectElement.inlineObjectId);
        }
      });
    }
  );

  const images = new Map<string, string>();
  for (let i = 0; i < inlineObjectElements.length; i++) {
    const inlineObjectId = inlineObjectElements[i];
    images.set(
      `image${i + 1}`,
      data?.inlineObjects[inlineObjectId].inlineObjectProperties.embeddedObject
        .imageProperties.contentUri
    );
  }

  const slug = slugify.default(name, { lower: true, remove: /[*+~.()'"!:@]/g });
  const markdownFile = await downloadFormat(
    auth,
    googleDocId,
    path.join(downloadPath, slug + ".md"),
    "markdown"
  );
  downloadedFiles.push(markdownFile);
  const res = await extractImagesFromMarkdown(markdownFile, slug, images);
  downloadedFiles.push(...res.images);
  const pdfFile = await downloadFormat(
    auth,
    googleDocId,
    path.join(downloadPath, slug + ".pdf"),
    "pdf"
  );
  downloadedFiles.push(pdfFile);
  return downloadedFiles;
}

export async function downloadFormat(
  auth: any,
  googleDocId: string,
  filepath: string,
  format: string
): Promise<string> {
  const exportUrl = `https://docs.google.com/feeds/download/documents/export/Export?id=${googleDocId}&exportFormat=${format}`;
  console.log(`Downloading ${exportUrl}`);

  const response = await fetch(exportUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${auth.credentials.access_token}`, // Include access token
    },
  });
  if (format === "markdown") {
    const markdown = await response.text();
    Deno.writeTextFile(filepath, markdown);
  }
  if (format === "pdf") {
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await Deno.writeFile(filepath, uint8Array);
  }
  console.log(`Downloaded ${filepath}`);
  return filepath;
}

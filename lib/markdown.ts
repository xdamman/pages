import path from "npm:path";
import { Buffer } from "node:buffer";

// Function to extract base64 images from markdown and save them as separate files
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64); // Decodes Base64 to a binary string
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i); // Convert to byte array
  }
  return bytes;
}

export async function extractImagesFromMarkdown(
  markdownFile: string,
  prefix: string,
  images: Map<string, string>
) {
  console.log(`Extracting images from ${markdownFile}`);
  const markdownContent = await Deno.readTextFile(markdownFile);
  //  [image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAAFRCAYAAACsdAO0AACAAElEQVR4XmzcBXgV1/rw7dNzTilWnACBCDHiQtzd3d3d3QghCcHiJISQBEhwdylWSg1qVKlAC3XqUFooUOz3PXtz3r9875vrWtfsPXtm9sia9dzPmrXzj039q9g62M6OoS52jvSxa9M6Xjl9jNfPnmR1+0pGBteydnUXh/fv4aWTx9k1soG+lkZWVhbRXlFAX105/YsqWF1XRk9tKV3yvm1RNWtWtdLfsYr2ZS1kpyTi4WCDrbEBOrNmoD1hHGbTJmM/dzre+ur4GWhKUSPUSp/
  const imageRegex =
    /\[([^\]]+)\]: ?<data:image\/(png|gif|jpg);base64,([^>]+)>/gm;
  let match;
  let updatedMarkdown = markdownContent;
  const outputPath = path.join(path.dirname(markdownFile), "images");
  // Ensure output directory exists
  try {
    await Deno.mkdir(outputPath);
  } catch (e) {}

  const imagePaths = [];
  while ((match = imageRegex.exec(markdownContent)) !== null) {
    const altText = match[1]; // Alt text for the image
    const imageType = match[2]; // Image type (png, jpeg, etc.)
    const base64Data = match[3]; // Base64-encoded image data

    // Create image file name and path
    const imageName = `${prefix}_${altText || "image"}.${imageType}`;
    const imagePath = path.join(outputPath, imageName);

    // Decode the base64 image data
    try {
      let imageBuffer;
      if (images.get(altText)) {
        const response = await fetch(images.get(altText) as string);
        const imageData = await response.arrayBuffer();
        imageBuffer = Buffer.from(imageData);
      } else {
        imageBuffer = Buffer.from(base64Data, "base64");
      }
      await Deno.writeFile(imagePath, imageBuffer);

      console.log(`Image saved as ${imagePath}`);
      imagePaths.push(imagePath);
      // Update the markdown content to point to the saved image
      const relativeImagePath = `./${path.relative(
        path.dirname(markdownFile),
        imagePath
      )}`;
      updatedMarkdown = updatedMarkdown
        .replace(match[0], "")
        .replace(`![][${altText}]`, `![${altText}](${relativeImagePath})`);
      // Save the updated markdown file
    } catch (e) {
      console.error("Error decoding base64 data", e);
    }
  }
  await Deno.writeTextFile(markdownFile, updatedMarkdown);
  console.log(`Updated markdown saved as ${markdownFile}`);

  return {
    markdown: updatedMarkdown,
    images: imagePaths,
  };
}

import {
  loadCredentials,
  authorize,
  listSharedFolders,
} from "./lib/googleapi.ts";
import { publishDocsInFolder } from "./lib/publishing.ts";

// Main function to execute the logic
const main = async () => {
  try {
    const credentials = await loadCredentials();
    const auth = await authorize(credentials);

    const folders = await listSharedFolders(auth);
    await folders.forEach(async (folder) => {
      await publishDocsInFolder(auth, folder);
    });
  } catch (error) {
    console.error(error);
  }
};

main();

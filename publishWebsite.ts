import {
  loadCredentials,
  authorize,
  listSharedFolders,
} from "./lib/googleapi.ts";
import { publishDocsInFolder } from "./lib/publishing.ts";
const folderName = Deno.args[0];

// Main function to execute the logic
const main = async () => {
  try {
    const credentials = await loadCredentials();
    const auth = await authorize(credentials);

    const folders = await listSharedFolders(auth);
    const folder = folders.find((folder) => folder.name === folderName);
    if (!folder) {
      console.error(`Folder ${folderName} not found`);
      return;
    }
    publishDocsInFolder(auth, folder);
  } catch (error) {
    console.error(error);
  }
};

main();

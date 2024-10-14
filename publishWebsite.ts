import {
  loadCredentials,
  authorize,
  listSharedFolders,
  listFolders,
  listGoogleDocs,
  Folder,
} from "./lib/googleapi.ts";
import { downloadGoogleDoc } from "./lib/googledoc.ts";
import path from "npm:path";
const folderName = Deno.args[0];

const publishDocsInFolder = async (
  auth: any,
  folder: Folder,
  basePath: string = "./dist"
) => {
  const folderPath = path.join(basePath, folder.name);
  try {
    const fileInfo = Deno.statSync(folderPath);
    const mtime = fileInfo.mtime;
    console.log(
      "local folder mtime",
      folderPath,
      mtime,
      "remote folder mtime",
      folder.mtime
    );
    if (mtime && mtime < folder.mtime) {
      console.log(
        `Skipping ${folder.name} because it is up to date`,
        mtime,
        folder.mtime
      );
      return;
    }
  } catch (e) {
    console.log(`Creating ${folderPath}`);
    Deno.mkdirSync(folderPath);
  }
  const docs = await listGoogleDocs(auth, folder.id);
  console.log(docs);
  await docs.forEach((doc) => {
    downloadGoogleDoc(auth, doc.id, folderPath);
  });
  const subFolders = await listFolders(auth, folder.id);
  console.log("subFolders", subFolders);
  subFolders.forEach((subFolder) => {
    publishDocsInFolder(auth, subFolder, folderPath);
  });
};

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

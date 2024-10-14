import path from "npm:path";
import { Folder, listGoogleDocs, listFolders } from "./googleapi.ts";
import { downloadGoogleDoc } from "./googledoc.ts";

export const publishDocsInFolder = async (
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

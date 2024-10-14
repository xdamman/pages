import { google } from "npm:googleapis";
// Load client secrets from a local file using Deno
import {
  loadCredentials,
  authorize,
  listGoogleDocs,
  listSharedFolders,
} from "./lib/googleapi.ts";

// const folderId = "1akFT2Au9-WqbsTNNKsa9-tsVYHs1U42-"; // Replace with your folder ID
const folderId = "17j0OV_C8efSespf84IYjAYHbiXJ1CuZw";

// Main function to execute the logic
const main = async () => {
  try {
    const credentials = await loadCredentials();
    const auth = await authorize(credentials);
    // await listGoogleDocs(auth, folderId);
    const folders = await listSharedFolders(auth);
    folders.forEach((folder) => {
      console.log(folder);
      const folderPath = `./dist/${folder.name}`;
      try {
        Deno.mkdirSync(folderPath);
        console.log("Created folder:", folderPath);
      } catch (error) {
        // console.error(error);
        const fileInfo = Deno.statSync(folderPath);
        const mtime = fileInfo.mtime;
        console.log(folderPath, mtime);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

main();

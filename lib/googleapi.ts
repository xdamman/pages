import { google } from "npm:googleapis";

export const loadCredentials = async (): Promise<any> => {
  try {
    const content = await Deno.readTextFile("credentials.json");
    return JSON.parse(content);
  } catch (err) {
    throw new Error("Error loading client secret file: " + err);
  }
};

// Create an OAuth2 client with the given credentials
export const authorize = async (credentials: any): Promise<any> => {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  try {
    const token = await Deno.readTextFile("token.json");
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    return getAccessToken(oAuth2Client);
  }
};

// Get and store new token after prompting for user authorization
export const getAccessToken = async (oAuth2Client: any): Promise<any> => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/documents.readonly",
    ],
  });
  console.log("Authorize this app by visiting this url:", authUrl);

  const code = prompt("Enter the code from that page here: ") || "";
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Store the token to disk for later program executions
    await Deno.writeTextFile("token.json", JSON.stringify(tokens));
    console.log("Token stored to token.json");
    return oAuth2Client;
  } catch (err) {
    throw new Error("Error retrieving access token: " + err);
  }
};

// Function to get metadata of a specific file
export const getFileMetadata = async (auth: any, fileId: string) => {
  const drive = google.drive({ version: "v3", auth });

  try {
    const res = await drive.files.get({
      fileId: fileId,
      fields: "id, name, mimeType, size, modifiedTime", // Specify the metadata fields you want
    });

    console.log("File Metadata:");
    console.log(res.data);
  } catch (error) {
    console.error("Error fetching file metadata:", error);
  }
};

// List files in a specific Google Drive folder
export const listFiles = async (auth: any, folderId: string) => {
  const drive = google.drive({ version: "v3", auth });

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents`,
      pageSize: 10,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
    });
    const files = res.data.files;
    if (files?.length) {
      console.log("Files:");
      files.map((file) => {
        if (file.mimeType === "application/vnd.google-apps.document") {
          getGoogleDocContent(auth, file.id as string);
        } else {
          console.log(
            `${file.name} (${file.id}, ${file.mimeType}, ${file.modifiedTime})`
          );
        }
      });
    } else {
      console.log("No files found.");
    }
  } catch (error) {
    console.error("The API returned an error:", error);
  }
};

export type Folder = {
  id: string;
  name: string;
  mtime: Date;
};

export async function listSharedFolders(auth: any): Promise<Folder[]> {
  const driveService = google.drive({ version: "v3", auth });
  const output: Folder[] = [];
  try {
    const response = await driveService.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and sharedWithMe",
      fields: "nextPageToken, files(id, name, modifiedTime)",
    });

    const folders = response.data.files;

    if (folders && folders.length) {
      folders.forEach((folder) => {
        output.push({
          id: folder.id as string,
          name: folder.name as string,
          mtime: new Date(folder.modifiedTime as string),
        });
      });
    } else {
      console.log("No shared folders found.");
    }
  } catch (error) {
    console.error("Error fetching shared folders: ", error);
  }
  return output;
}
export async function listFolders(
  auth: any,
  folderId: string
): Promise<Folder[]> {
  const driveService = google.drive({ version: "v3", auth });
  const output: Folder[] = [];
  try {
    const response = await driveService.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: "nextPageToken, files(id, name, modifiedTime)",
    });

    const folders = response.data.files;

    if (folders && folders.length) {
      folders.forEach((folder) => {
        output.push({
          id: folder.id as string,
          name: folder.name as string,
          mtime: new Date(folder.modifiedTime as string),
        });
      });
    } else {
      console.log("No shared folders found.");
    }
  } catch (error) {
    console.error("Error fetching shared folders: ", error);
  }
  return output;
}

type GoogleDoc = {
  id: string;
  name: string;
  mtime: Date;
};

export async function listGoogleDocs(
  auth: any,
  folderId: string
): Promise<GoogleDoc[]> {
  const driveService = google.drive({ version: "v3", auth });
  const output: GoogleDoc[] = [];
  try {
    const response = await driveService.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.document'`,
      fields:
        "nextPageToken, files(id, name, modifiedTime, permissions, owners)",
    });

    const files = response.data.files;

    if (files && files.length) {
      files.forEach((file) => {
        console.log(file);
        output.push({
          id: file.id as string,
          name: file.name as string,
          mtime: new Date(file.modifiedTime as string),
        });
      });
    } else {
      console.log("No files found.");
    }
  } catch (error) {
    console.error("Error fetching files: ", error);
  }
  return output;
}

export type GoogleDocContent = {
  title: string;
  body: any;
  inlineObjects: any;
};

export const getGoogleDocContent = async (
  auth: any,
  documentId: string
): Promise<GoogleDocContent | null> => {
  const docs = google.docs({ version: "v1", auth });

  try {
    const res = await docs.documents.get({
      documentId: documentId,
      fields: "",
    });

    // console.log("Document:", res.data);
    // Deno.writeTextFile(`${documentId}.json`, JSON.stringify(res.data, null, 2));
    return res.data as GoogleDocContent;
    // Deno.writeTextFile(`${documentId}.html`, html);
  } catch (error) {
    console.error("Error fetching Google Doc content:", error);
  }
  return null;
};

export async function getGoogleDocContributors(auth: any, googleDocId: string) {
  const driveService = google.drive({ version: "v3", auth });

  try {
    const response = await driveService.revisions.list({
      fileId: googleDocId,
      fields:
        "revisions(id, modifiedTime, lastModifyingUser(displayName, photoLink, emailAddress))",
    });

    const revisions = response.data.revisions;

    if (revisions && revisions.length) {
      const contributionMap = new Map<string, number>();

      revisions.forEach((revision) => {
        const user = revision.lastModifyingUser;
        if (user) {
          const key = `${user.displayName} (${user.emailAddress})`;
          // Increment the count for this contributor
          contributionMap.set(key, (contributionMap.get(key) || 0) + 1);
        }
      });

      // contributionMap.forEach((data, contributor) => {
      //   console.log(`${contributor}: ${data.count} revisions`);
      //   console.log(`Avatar: ${data.avatar || "No avatar available"}`);
      // });
    } else {
      console.log("No revisions found for the document.");
    }
  } catch (error) {
    console.error("Error fetching revisions: ", error);
  }
}

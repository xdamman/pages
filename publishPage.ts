import {
  loadCredentials,
  authorize,
  getGoogleDocContent,
} from "./lib/googleapi.ts";

const arg = Deno.args[0];

const TEST_GOOGLE_DOC_ID = "1mCjheAOEicVAfuR1bBUF6YDVTX5kX9mnAn8nrmbUgxs";

const googleDocId = arg === "test" ? TEST_GOOGLE_DOC_ID : arg;

console.log(">>> parsing google doc", googleDocId);
// Main function to execute the logic
const main = async () => {
  try {
    const credentials = await loadCredentials();
    const auth = await authorize(credentials);
    await getGoogleDocContent(auth, googleDocId);
  } catch (error) {
    console.error(error);
  }
};

main();

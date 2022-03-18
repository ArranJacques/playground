import { Auth } from "@aws-amplify/auth";
import "../foundation/bootstrap";

const { EMAIL, VERIFICATION_CODE } = process.env;

async function run() {
  try {
    await Auth.confirmSignUp(EMAIL || "", VERIFICATION_CODE || "");
    console.log("verified!");
  } catch (error) {
    console.log("error verifying user:", error);
  }
}

run();

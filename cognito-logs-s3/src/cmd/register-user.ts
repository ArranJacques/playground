import { Auth } from "@aws-amplify/auth";
import "../foundation/bootstrap";

const { FIRST_NAME, LAST_NAME, EMAIL, PASSWORD } = process.env;

async function run() {
  try {
    const { user } = await Auth.signUp({
      username: EMAIL || "",
      password: PASSWORD || "",
      attributes: {
        email: EMAIL || "",
        given_name: FIRST_NAME || "",
        family_name: LAST_NAME || "",
      },
    });
    console.log(user);
  } catch (error) {
    console.log("error signing up:", error);
  }
}

run();

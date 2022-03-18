import Amplify from "@aws-amplify/auth";
import "dotenv/config";

const { AWS_REGION, AWS_COGNITO_USER_POOL_ID, AWS_COGNITO_CLIENT_ID_ID } =
  process.env;

Amplify.configure({
  Auth: {
    region: AWS_REGION,
    userPoolId: AWS_COGNITO_USER_POOL_ID,
    userPoolWebClientId: AWS_COGNITO_CLIENT_ID_ID,
  },
});

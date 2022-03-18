#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { CdkCognitoLogsS3Stack } from "../src/stack/stack";

const app = new cdk.App();

new CdkCognitoLogsS3Stack(app, "poc-cognito-logs-s3", {
  stackName: "poc-cognito-logs-s3",
  env: {
    region: "eu-west-1",
  },
});

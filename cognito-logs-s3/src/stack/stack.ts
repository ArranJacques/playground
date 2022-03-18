import * as cloudtrail from "@aws-cdk/aws-cloudtrail";
import * as cognito from "@aws-cdk/aws-cognito";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";
import * as s3 from "@aws-cdk/aws-s3";
import * as sqs from "@aws-cdk/aws-sqs";
import * as cdk from "@aws-cdk/core";
import * as path from "path";

export class CdkCognitoLogsS3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool...

    const userPool = new cognito.UserPool(this, "user-pool", {
      userPoolName: "poc-cognito-logs-s3",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        country: new cognito.StringAttribute({ mutable: true }),
        city: new cognito.StringAttribute({ mutable: true }),
        isAdmin: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
    };

    const clientReadAttributes =
      new cognito.ClientAttributes().withStandardAttributes(
        standardCognitoAttributes
      );

    const clientWriteAttributes =
      new cognito.ClientAttributes().withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "user-pool-client",
      {
        userPool,
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userSrp: true,
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        readAttributes: clientReadAttributes,
        writeAttributes: clientWriteAttributes,
      }
    );

    // Create SQS queue.
    const queue = new sqs.Queue(this, "OurSqsQueue", {
      queueName: "poc-cognito-logs-s3",
    });

    // Add Cloud Trail rule to filter events related to Cognito and send them into
    // the SQS queue.
    cloudtrail.Trail.onEvent(this, "cloud-watch-event", {
      target: new targets.SqsQueue(queue),
      eventPattern: {
        source: ["aws.cognito-idp"],
      },
    });

    // Create Lambda write events to S3.
    const handler = new NodejsFunction(this, "event-handler", {
      functionName: "poc-cognito-logs-s3",
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: "handler",
      entry: path.join(__dirname, "../handler/event.ts"),
    });

    // Subscribe the handler to the SQS queue.
    handler.addEventSource(new SqsEventSource(queue, { batchSize: 1 }));

    // Create S3 bucket to store events.
    const s3Bucket = new s3.Bucket(this, "s3-bucket", {
      bucketName: "poc-cognito-logs-s3",
    });

    // Create an IAM policy to allow the Lambda to write to S3.
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject", "s3:PutObjectAcl"],
      resources: ["arn:aws:s3:::poc-cognito-logs-s3/*"],
    });

    // Attach the IAM policy to Lambda.
    handler.role?.attachInlinePolicy(
      new iam.Policy(this, "poc-cognito-logs-s3", {
        statements: [s3Policy],
      })
    );

    // Stack outputs...

    new cdk.CfnOutput(this, "userPoolId", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "userPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
  }
}

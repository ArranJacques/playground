import { SQSEvent } from "aws-lambda";
import { S3 } from "aws-sdk";

export async function handler(event: SQSEvent) {
  const [record] = event.Records;

  console.log("parsing event body...");

  const payload = JSON.parse(record.body);

  console.log("parsed:", payload);

  console.log("writing to s3...");

  await new S3()
    .putObject({
      Bucket: "poc-cognito-logs-s3",
      Key: `${payload.id}.json`,
      Body: JSON.stringify(payload, null, 2),
    })
    .promise();

  console.log("complete!");
}

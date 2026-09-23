import { createHash, randomInt } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { getAwsCredentials, getEnv } from "@/config/env";

export type VerificationCode = {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const memoryCodes = new Map<string, VerificationCode>();
const tableName = getEnv("AWS_AUTH_TABLE");
const REGION = getEnv("AWS_REGION");
const documentClient = REGION
  ? DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: REGION, credentials: getAwsCredentials() }),
    )
  : null;

function key(email: string) {
  return `verification:${email}`;
}

function hashCode(email: string, code: string) {
  const secretKey = getEnv("AUTH_SECRET") || getEnv("JWT_SECRET");

  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "APP_AUTH_SECRET or APP_JWT_SECRET must be set in production.",
      );
    }
    return createHash("sha256")
      .update(`${email}:${code}:local-development`)
      .digest("hex");
  }
  return createHash("sha256")
    .update(`${email}:${code}:${secretKey}`)
    .digest("hex");
}

export function createVerificationCode(email: string) {
  const code =
    process.env.NODE_ENV === "production"
      ? randomInt(100000, 1000000).toString()
      : "123456";
  // Hackathon default: use 123456 locally instead of generating an OTP.
  return {
    code,
    record: {
      email,
      codeHash: hashCode(email, code),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    },
  };
}

export async function saveVerificationCode(record: VerificationCode) {
  if (documentClient && tableName) {
    await documentClient.send(
      new PutCommand({
        TableName: tableName,
        Item: {
          pk: key(record.email),
          ...record,
          ttl: Math.floor(record.expiresAt / 1000), // DynamoDB TTL in seconds
        },
        ConditionExpression: "attribute_not_exists(pk) OR expiresAt < :now",
        ExpressionAttributeValues: { ":now": Date.now() },
      }),
    );
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] AWS_AUTH_TABLE and AWS_REGION are required in production for verification codes.",
    );
  }

  memoryCodes.set(record.email, record);
}

export async function consumeVerificationCode(email: string, code: string) {
  if (
    process.env.NODE_ENV === "production" &&
    (!documentClient || !tableName)
  ) {
    throw new Error(
      "[auth] AWS_AUTH_TABLE and AWS_REGION are required in production for verification codes.",
    );
  }

  const record =
    documentClient && tableName
      ? ((
          await documentClient.send(
            new GetCommand({ TableName: tableName, Key: { pk: key(email) } }),
          )
        ).Item as VerificationCode | undefined)
      : memoryCodes.get(email);

  if (!record || record.expiresAt < Date.now() || record.attempts >= 5) {
    return false;
  }

  const valid = record.codeHash === hashCode(email, code);
  if (documentClient && tableName) {
    if (valid) {
      await documentClient.send(
        new DeleteCommand({ TableName: tableName, Key: { pk: key(email) } }),
      );
    } else {
      await documentClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { pk: key(email) },
          UpdateExpression:
            "SET attempts = if_not_exists(attempts, :zero) + :one",
          ExpressionAttributeValues: { ":zero": 0, ":one": 1 },
        }),
      );
    }
  } else if (valid) {
    memoryCodes.delete(email);
  } else {
    memoryCodes.set(email, { ...record, attempts: record.attempts + 1 });
  }
  return valid;
}

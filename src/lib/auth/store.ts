import { createHash, randomInt } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

export type VerificationCode = {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const memoryCodes = new Map<string, VerificationCode>();
const tableName = process.env.aWs_AUTH_TABLE;
const documentClient = process.env.aWs_REGION
  ? DynamoDBDocumentClient.from(new DynamoDBClient({}))
  : null;

function key(email: string) {
  return `verification:${email}`;
}

function hashCode(email: string, code: string) {
  return createHash("sha256")
    .update(
      `${email}:${code}:${process.env.AUTH_SECRET ?? "local-development"}`,
    )
    .digest("hex");
}

export function createVerificationCode(email: string) {
  const code = randomInt(100000, 1000000).toString();
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
        Item: { pk: key(record.email), ...record },
        ...{
          ConditionExpression: "attribute_not_exists(pk) OR expiresAt < :now",
          ExpressionAttributeValues: { ":now": Date.now() },
        },
      }),
    );
    return;
  }
  memoryCodes.set(record.email, record);
}

export async function consumeVerificationCode(email: string, code: string) {
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
    }
  } else if (valid) {
    memoryCodes.delete(email);
  } else {
    memoryCodes.set(email, { ...record, attempts: record.attempts + 1 });
  }
  return valid;
}

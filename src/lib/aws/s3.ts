export async function getSeedContent(key: string) {
  return { key, content: null, configured: Boolean(process.env.AWS_S3_BUCKET) };
}

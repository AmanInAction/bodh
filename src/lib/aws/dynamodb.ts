export async function getStudentProgress(studentId: string) {
  return { studentId, configured: Boolean(process.env.AWS_DYNAMODB_TABLE) };
}

export async function indexUsers(batch, operation) {
  const { hash, data } = operation;
  await batch.put('users!' + hash, { hash, data });
}

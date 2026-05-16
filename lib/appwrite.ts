import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

// Add an empty string fallback ("") to prevent .replace() from trying to read undefined
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

if (endpoint) {
  client.setEndpoint(endpoint);
}
if (projectId) {
  client.setProject(projectId);
}

export const databases = new Databases(client);
export const account = new Account(client);
export { client };
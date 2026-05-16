import { Client, Databases, Account, Query, ID } from 'appwrite';

const client = new Client();

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

// ADD THESE TWO EXPORTS SO YOUR PAGES CAN USE THEM:
export { client, Query, ID };
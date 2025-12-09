import { runLineraCommand } from "./linera-cli";

export async function publishBlob(blobPath: string) {
    const { stdout } = await runLineraCommand(`-w2 publish-data-blob ${blobPath}`);
    const blobHash = stdout.trim();
    return blobHash;
}
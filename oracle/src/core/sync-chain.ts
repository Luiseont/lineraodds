import { runLineraCommand } from "./linera-cli";

export async function syncChain() {
    const { stdout } = await runLineraCommand('-w2 sync');
    return stdout;
}

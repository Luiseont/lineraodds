import * as util from 'util';
import { exec } from 'child_process';
const execPromise = util.promisify(exec);

/**
 * Ejecuta un comando del CLI de Linera de forma asíncrona.
 * @param command - El comando de Linera a ejecutar (ej. 'wallet show' o 'publish-data-blob').
 * @returns Un objeto con la salida estándar (stdout) y la salida de error (stderr).
 */
export async function runLineraCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    const fullCommand = `linera ${command}`;

    try {
        const { stdout, stderr } = await execPromise(fullCommand, {
            timeout: 60000
        });

        if (stderr) {
            console.warn(`[Linera WARN] Comando: ${fullCommand}\nSalida de error: ${stderr.trim()}`);
        }

        return { stdout, stderr };

    } catch (error) {
        const errorMessage = (error as Error).message || 'Error desconocido al ejecutar el comando Linera.';
        console.error(`[Linera ERROR] Falló la ejecución de ${fullCommand}:`, errorMessage);
        throw new Error(`Linera execution failed: ${errorMessage}`);
    }
}
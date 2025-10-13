import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
const LOG_FILE = path.join(os.homedir(), '.laminar.log');
export function logUsage(source, command, args) {
    try {
        const timestamp = new Date().toISOString();
        const argsStr = JSON.stringify(args);
        const logEntry = `[${timestamp}] [source: ${source}] command: ${command} args: ${argsStr}\n`;
        fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
    }
    catch (error) {
        process.stderr.write(`Warning: Failed to write to ${LOG_FILE}: ${error}\n`);
    }
}
//# sourceMappingURL=logger.js.map
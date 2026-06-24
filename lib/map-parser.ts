import { attempt } from "./utils.ts";

export type FunctionOffset = {
    name: string;
    offset: number;
};

export async function parseMapFunctions() {
    try {
        const map = await Deno.readTextFile("./temp.map");
        const result: FunctionOffset[] = [];

        await attempt(async () => await Deno.remove("./temp.map"));

        for (const line of map.split(/\r?\n/)) {
            const match = line.match(
                /^\s*(0x[0-9a-fA-F]+)\s+(.*)$/
            );

            if (!match)
                continue;

            const offset = parseInt(match[1], 16);
            const rest = match[2].trim();

            // Ignore:
            // 0x48 ./main.o
            // 0x34 ./strlen.o
            // 0xe ./main.o
            if (/^0x[0-9a-fA-F]+\s+.+\.o$/.test(rest))
                continue;

            // Ignore sizes
            if (/^0x[0-9a-fA-F]+$/.test(rest))
                continue;

            // Ignore linker junk
            if (
                rest.startsWith(".") ||
                rest.startsWith("*") ||
                rest.includes("linker stubs") ||
                rest.includes("OUTPUT") ||
                rest.includes("LOAD") ||
                rest.includes("size before")
            ) {
                continue;
            }

            result.push({
                name: rest.split("(")[0],
                offset
            });
        }

        return result;
    } catch {
        await attempt(async () => await Deno.remove("./temp.map"));
        throw new Error("Failed to parse map");
    }
}
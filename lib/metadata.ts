import { attempt } from "./utils.ts"
import { $ } from "../deps.ts"

export type Metadata = {
    target: string,
    symbol: string,
    address: number,
    instruction: Uint8Array
}[]

export type JSONMetadata = Record<string, {
    target: string,
    address: string,
    instruction: string
}>

export async function readMetadata(): Promise<Metadata> {
    try {
        const jsonMetadata = JSON.parse(await Deno.readTextFile("./metadata.json")) as JSONMetadata
        const entries = Object.entries(jsonMetadata);
        const metadata = [] as Metadata;

        for (const entry of entries) {
            const value = entry[1];
            const symbol = entry[0];

            if (value.address.startsWith("0x")) value.address = value.address.slice(2);
            if (value.address.startsWith("6")) value.address = value.address.slice(1);

            const address = parseInt(value.address, 16);

            if (isNaN(address)) {
                console.error("Invalid metadata address");
                throw new Error("");
            }
            const instruction = await compileASM(value.instruction);
            const target = value.target;

            metadata.push({
                target,
                symbol,
                address,
                instruction
            });
        }

        return metadata;
    } catch {
        throw new Error("Failed to parse metadata.json");
    }
}

export async function compileASM(instruction: string) {
    instruction = instruction.toLowerCase();

    await attempt(async () => await Deno.remove("./temp.s"));
    await attempt(async () => await Deno.remove("./temp.o"));
    await attempt(async () => await Deno.remove("./temp.bin"));

    const code = `.arm\n${instruction}\n`;

    await attempt(async () => await Deno.writeTextFile("./temp.s", code)); 
    await $.inherit`arm-none-eabi-as temp.s -o temp.o`;
    await $.inherit`arm-none-eabi-objcopy -O binary -j .text temp.o temp.bin`

    const compiled = await attempt(async () => await Deno.readFile("./temp.bin"));

    await attempt(async () => await Deno.remove("./temp.s"));
    await attempt(async () => await Deno.remove("./temp.o"));
    await attempt(async () => await Deno.remove("./temp.bin"));

    if (!compiled) throw new Error("Failed to compile instruction");

    return compiled.slice(0, 4);
}
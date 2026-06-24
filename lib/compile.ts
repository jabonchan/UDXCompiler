import { arm32BranchForward, arm32BranchBack } from "./branch-generator.ts";
import { getCodeFiles, getObjectFiles } from "./get-files.ts";
import { parseMapFunctions } from "./map-parser.ts";
import { readMetadata } from "./metadata.ts"
import { attempt, hexify } from "./utils.ts";
import { $ } from "../deps.ts";

const customCodeStartAddress = 0x009AE990;

export async function compile() {
    let sourceObjects = await getObjectFiles();

    for (const obj of sourceObjects)
        await attempt(async () => await Deno.remove(obj));

    await attempt(async () => await Deno.remove("./temp.elf"));
    await attempt(async () => await Deno.remove("./temp.map"));
    await attempt(async () => await Deno.remove("./patch.sectext"));
    
    const sourceFiles = await getCodeFiles();

    try {
        await $.inherit`
            arm-none-eabi-g++
            -c
            ${sourceFiles}
            -O2
            -march=armv8-a
            -ffreestanding
            -fPIC
            -ffunction-sections
            -fdata-sections
            -fno-exceptions
            -fno-rtti
            -fno-unwind-tables
            -fno-asynchronous-unwind-tables
            -fno-threadsafe-statics
            -fvisibility=hidden
        `

        sourceObjects = await getObjectFiles();

        await $.inherit`
            arm-none-eabi-g++
            ${sourceObjects}
            -T
            "./assets/link.ld"
            -Wl,-Map=temp.map
            -nostdlib
            -nostartfiles
            -nodefaultlibs
            -o
            "./temp.elf"
        `

        await $.inherit`
            arm-none-eabi-objcopy
            -O
            binary
            "./temp.elf"
            "./patch.sectext"
        `

        const metadata = await readMetadata();
        const map = await parseMapFunctions();
        
        for (const obj of sourceObjects)
            await attempt(async () => await Deno.remove(obj));

        await attempt(async () => await Deno.remove("./temp.map"));
        await attempt(async () => await Deno.remove("./temp.elf"));

        const section = await Deno.readFile("./patch.sectext");
        const patches = [] as string[];

        for (const definition of metadata) {
            const info = map.find(func => func.name === definition.symbol);
            const placeholder = map.find(func => func.name === definition.target);

            if (!info || !placeholder) {
                console.error(`Non existing symbol: ${definition.symbol} or Non existing target`);
                throw new Error("");
            }

            const targetFunctionAddress = definition.address + 4;
            const customFunctionAddress = customCodeStartAddress + info.offset;
            const branchForward = arm32BranchForward(targetFunctionAddress, customFunctionAddress + 4);

            patches.push(`${hexify(targetFunctionAddress - 4, 8, true)}: ${[ ...branchForward.byte ].map(byte => hexify(byte, 2, false)).join(" ")}`);

            const placeHolderFunctionAddress = customCodeStartAddress + placeholder.offset + 4;
            const branchBackwards = arm32BranchBack(placeHolderFunctionAddress + 4, targetFunctionAddress + 4);

            section.set(definition.instruction, placeHolderFunctionAddress - customCodeStartAddress - 4);
            section.set(branchBackwards.byte, placeHolderFunctionAddress - customCodeStartAddress);

            console.log(`\n(${definition.symbol}, ${definition.target}) patch.sectext:${hexify(placeHolderFunctionAddress - customCodeStartAddress - 4, 8, true)}: Inserted stolen instruction, instruction: ${hexify(definition.instruction, 0, false)}`)
            console.log(`(${definition.symbol}, ${definition.target}) patch.sectext:${hexify(placeHolderFunctionAddress - customCodeStartAddress, 8, true)}: Inserted trampoline from ${hexify(placeHolderFunctionAddress, 8, true)} to ${hexify(targetFunctionAddress, 8, true)}, instruction: ${branchBackwards.hex}`);

            await Deno.writeFile("./patch.sectext", section);
            await Deno.writeTextFile("./patch.nsotext", patches.join("\n"));
        }
    } catch {
        for (const obj of sourceObjects)
            await attempt(async () => await Deno.remove(obj));

        await attempt(async () => await Deno.remove("./temp.map"));
        await attempt(async () => await Deno.remove("./temp.elf"));
        await attempt(async () => await Deno.remove("./patch.nsotext"));
        await attempt(async () => await Deno.remove("./patch.sectext"));

        throw new Error("Failed to compile");
    }
}
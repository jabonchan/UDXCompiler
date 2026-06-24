export async function getCodeFiles(dir: string = "./src"): Promise<string[]> {
    try {
        const files: string[] = [];

        for await (const entry of Deno.readDir(dir)) {
            const path = `${dir}/${entry.name}`;

            if (entry.isDirectory) {
                files.push(...await getCodeFiles(path));
            } else if (entry.isFile && entry.name.toLowerCase().endsWith(".cpp")) {
                files.push(path);
            }
        }

        return files;
    } catch {
        throw new Error("Failed to retrieve source code");
    }
}

export async function getObjectFiles(): Promise<string[]> {
    const files: string[] = [];

    try {
        for await (const entry of Deno.readDir("./")) {
            if (!entry.isFile || !entry.name.toLowerCase().endsWith(".o")) continue;
            files.push("./" + entry.name);
        }

        return files;
    } catch {
        throw new Error("Failed to retrieve objects");
    }
}
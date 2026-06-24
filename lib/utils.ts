export async function attempt<T>(cb: () => T) {
    try {
        return await cb();
    } catch {
        return null;
    }
}

export function hexify(value: number | Uint8Array | number[], size: number, prefix: boolean = false) {
    if ("length" in (typeof value === "number" ? {} : value)) {
        value = [ ...(value as number[]) ];

        return value.map(byte => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    }

    let string = value.toString(16).toUpperCase().padStart(size, "0");
    if (prefix) string = "0x" + string;
    return string;
}
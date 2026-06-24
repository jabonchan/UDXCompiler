export function arm32BranchForward(sourceAddress: number, targetAddress: number) {
    sourceAddress += 8;

    const offset = targetAddress - sourceAddress;

    if (offset % 4 !== 0) {
        throw new Error("Target is not 4-byte aligned");
    }

    const imm24 = (offset >> 2) & 0x00FFFFFF;
    const instruction = 0xEA000000 | imm24;
    const bytes = [
        instruction & 0xFF,
        (instruction >> 8) & 0xFF,
        (instruction >> 16) & 0xFF,
        (instruction >> 24) & 0xFF
    ];

    return {
        byte: new Uint8Array(bytes),
        hex: bytes.map(b => b.toString(16).padStart(8, "0").toUpperCase()).join(" ")
    }
}

export function arm32BranchBack(sourceAddress: number, targetAddress: number) {
    sourceAddress += 8;
    const offset = BigInt(targetAddress) - BigInt(sourceAddress);

    if (offset % 4n !== 0n) {
        throw new Error("Target is not 4-byte aligned");
    }

    const imm24 = (offset >> 2n) & 0xFFFFFFn;
    const instr = 0xEA000000n | imm24;

    const bytes = [
        Number(instr & 0xFFn),
        Number((instr >> 8n) & 0xFFn),
        Number((instr >> 16n) & 0xFFn),
        Number((instr >> 24n) & 0xFFn),
    ];

    return {
        byte: new Uint8Array(bytes),
        hex: bytes.map(b => b.toString(16).padStart(2, "0").toUpperCase()).join(" ")
    };
}
export function decodeArmBranchOffset(bytes: Uint8Array, offset = 0) {
    if (bytes.length - offset < 4) {
        throw new Error("Need 4 bytes");
    }

    // ARM little endian -> bigint
    const instr =
        BigInt(bytes[offset + 0]) |
        (BigInt(bytes[offset + 1]) << 8n) |
        (BigInt(bytes[offset + 2]) << 16n) |
        (BigInt(bytes[offset + 3]) << 24n);

    // Check B / BL
    if ((instr & 0x0E000000n) !== 0x0A000000n) {
        throw new Error("Not an ARM branch instruction");
    }

    let imm24 = instr & 0x00FFFFFFn;

    // sign extend 24-bit
    if (imm24 & 0x800000n) {
        imm24 -= 0x1000000n;
    }

    // branch offset = signed imm24 * 4
    return Number(imm24 << 2n);
}
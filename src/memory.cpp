#include "./memory.hpp"

extern "C" __attribute__((naked, section(".text.GetCustomCodeAddress"))) uint32_t GetCustomCodeAddress() {
    __asm__ volatile(
        "sub r0, pc, #8\n"
        "bx lr\n"
    );
}

void* malloc(uint32_t size) {
    uint32_t address = LOOKUP_VIRTUAL_ADDRESS(0x008DE044);
    operator_new_t game_new = (operator_new_t)address;

    return game_new(size);
}

void free(void* pointer) {
    uint32_t address = LOOKUP_VIRTUAL_ADDRESS(0x008DE3A0);
    operator_delete_t game_delete = (operator_delete_t)address;

    game_delete(pointer);
}

void* operator new(unsigned int size) {
    return malloc(size);
}

void* operator new[](unsigned int size) {
    return malloc(size);
}

void operator delete(void* ptr) noexcept {
    free(ptr);
}

void operator delete[](void* ptr) noexcept {
    free(ptr);
}

void* memset(void* pointer, uint8_t fill, uint32_t size) {
    uint8_t* bytes = (uint8_t*)pointer;

    for (uint32_t i = 0; i < size; i++) {
        bytes[i] = fill;
    }

    return pointer;
}

void* calloc(uint32_t num, uint32_t size) {
    return malloc(num * size);
}
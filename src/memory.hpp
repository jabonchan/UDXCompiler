#ifndef HEADER_MEMORY
#define HEADER_MEMORY

#include "./types.hpp"

extern "C" __attribute__((naked, section(".text.GetCustomCodeAddress"))) uint32_t GetCustomCodeAddress();

#define LOOKUP_VIRTUAL_ADDRESS(FunctionFileAddress) (GetCustomCodeAddress() - (0x009AE990u - ((unsigned int)(FunctionFileAddress))))
#define TRAMPOLINE_START __attribute__((naked))
#define TRAMPOLINE_END { \
    __asm__ volatile ( \
        ".space 8" \
    ); \
}

typedef void* (*operator_new_t)(unsigned int);
typedef void (*operator_delete_t)(void*);

void* malloc(unsigned int size);
void free(void* pointer);

void* operator new(unsigned int size);
void* operator new[](unsigned int size);
void operator delete(void* ptr);
void operator delete[](void* ptr);

void* memset(void* pointer, uint8_t fill, uint32_t size);
void* calloc(uint32_t num, uint32_t size);

#endif
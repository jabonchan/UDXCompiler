# UDXCompiler

UDXCompiler is a toolchain for compiling custom C++ code to be injected
into New Super Mario Bros. U Deluxe.

Unlike normal Switch development environments, UDXCompiler does not
depend on `stdlib`, `libnx`, or any Switch runtime libraries. It is
designed for generating standalone machine code that can be patched
directly into the game's NSO.

## Overview

UDXCompiler takes C++ source code and generates two files:

-   `.nsotext` - Text patch definitions containing machine code
    replacements
-   `.sectext` - A raw binary blob containing the compiled custom code
    and data

The generated `.sectext` is appended to the `.text` section of the
game's main NSO.

All variables and data used by the custom code are bundled inside this
generated section.

## Directory Structure

Your project must contain a `src` folder next to the UDXCompiler
executable with:

    YourProject/
    ├── UDXCompiler.exe
    └── src/
        ├── main.cpp
        ├── main.hpp
        ├── memory.cpp*
        ├── memory.hpp*
        └── types.hpp*

After running UDXCompiler, the output files (`patch.nsotext` and `patch.sectext`) will be generated next to the executable.

Tho files marked with * are mandatory to be in the `src` folder and referenced by your code.

## NSO Text Patches

The `.nsotext` file contains static patches that replace existing
instructions/data inside the game's `.text` section.

Format:

    0xGAME_FUNCTION_OR_DATA_FILE_ADDRESS: MACHINE CODE BYTES

The address must correspond to the function/data being patched.

The address is relative to the start of the NSMBUDX `.text` section,
which is treated as:

    0x00000000

when specifying patches.

## Custom Code Section

The `.sectext` file is a raw binary blob.

It contains:

-   Compiled machine code
-   Static data
-   Variables
-   Generated code required by injected functions

This blob is appended directly to the game's `.text` section.

## Runtime Restrictions

Generated code runs without:

-   stdlib
-   libnx
-   C++ runtime libraries
-   External dependencies
-   Throw/Catch

Your code must be self-contained.

## Memory Utilities

UDXCompiler includes `memory.cpp` and `memory.hpp`.

They provide implementations for:

-   new
-   delete
-   malloc
-   calloc
-   memset
-   free

They also provide:

``` cpp
GetCustomCodeAddress()
```

which returns the runtime memory address where the injected custom code
starts.

These files are required and must not be removed.

## Virtual Address Lookup

UDXCompiler provides:

``` cpp
LOOKUP_VIRTUAL_ADDRESS(GAME_FUNCTION_OR_DATA_FILE_ADDRESS)
```

which converts a physical `.text` section address into its runtime
address.

## Calling Switch / Game Functions

Because there is no Switch runtime environment, calls must be
implemented manually.

Use inline assembly for:

-   function calls
-   SVC calls
-   register manipulation
-   custom ARM instructions

Example:

``` cpp
__asm__ volatile(
    "..."
);
```

## Included Types

`types.hpp` provides common C++ types needed when compiling without
standard libraries.

## Requirements

-   devkitARM binaries in `PATH`
-   C++ knowledge
-   ARM assembly knowledge

## Hooks/Trampolines

UDXCompiler supports automatic hook generation through trampolines.

A trampoline allows you to replace an existing game function with your
own custom function while still being able to call the original
function.

### Creating a Hook

Next to the UDXCompiler executable, create a `metadata.json` file.

This file describes the functions you want to hook:

``` json
{
    "Custom_Function_Name": {
        "target": "Original_Function_Name",
        "address": "Original_Function_File_Address",
        "instruction": "Original_Function_First_Instruction"
    }
}
```

Each entry contains:

-   `Custom_Function_Name`

    The name of your custom function containing the injected code (doesn't needs to be exactly the same name of the original function).

-   `target`

    The name you choose to reference the original function. This name will be used to generate the trampoline.

-   `address`

    The address of the original function relative to the start of the
    `.text` section of NSMBUDX's main NSO.

-   `instruction`

    The first ARM instruction of the original function.

This instruction is used to correctly preserve the overwritten code when
creating the trampoline.

### Defining the Trampoline

After generating the project, define the trampoline in a header file:

``` cpp
TRAMPOLINE_START ReturnType Original_Function_Name(Parameters) TRAMPOLINE_END;
```

The declaration must match the original function signature.

### Using the Hook

Create your custom function using the name specified in `metadata.json`:

`src/my_code.hpp`
```cpp
TRAMPOLINE_START void* StageActor_StageActor(void* p1, void* p2) TRAMPOLINE_END;
```

`src/my_code.cpp`
``` cpp
void* Custom_StageActor_StageActor(void* p1, void* p2) {

    // Your custom code here

    return StageActor_StageActor(p1, p2);
}
```

`metadata.json`
```json
{
    "Custom_StageActor_StageActor": {
        "target": "StageActor_StageActor",
        "address": "0x000002A0",
        "instruction": "push {r4-r7,r11,lr}"
    }
}
```

Calling the trampoline will execute the original game function.

### Notes

-   Hooks are generated at compile time.
-   The trampoline automatically restores the overwritten instruction.
-   The original function can be called normally from your custom code.
-   Function parameters must follow the ARM calling convention.
-   Incorrect function signatures may corrupt registers or memory.

## Building

Have `deno` available on `PATH` then run `compile.bat`. Place `assets` folder next to the generated executable.

## Injecting Code and Patches

You must use the generated `.nsotext` and `.sectext` files with [`UDXPatcher`](https://github.com/jabonchan/UDXPatcher).


## LICENSE

UDXPatcher is licensed under MIT. By using this project you agree to everything stated in the license.

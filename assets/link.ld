/* link.ld */

ENTRY(GetCustomCodeAddress)

SECTIONS
{
    . = 0;

    .text :
    {
        /* force the payload entry point to byte 0 */
        KEEP(*(.text.GetCustomCodeAddress))

        /* all other code */
        *(.text*)

        /* constants / strings / jump tables */
        *(.rodata*)

        /* initialized writable data */
        *(.data*)
    }

    .bss :
    {
        *(.bss*)
        *(COMMON)
    }
}
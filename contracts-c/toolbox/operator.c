
#include <stdint.h>
#include "hookapi.h"

#define OP3(a, b, c) (((a) << 16) | ((b) << 8) | (c))

int64_t hook(uint32_t r)
{
    _g(1, 1);

    int64_t tt = otxn_type();
    uint8_t op_bytes[4];
    if (otxn_param(&op_bytes, 3, "OP", 2) != 3)
        NOPE("operator.c: Missing OP parameter.");

    uint32_t op = (op_bytes[0] << 16) | (op_bytes[1] << 8) | op_bytes[2];

    // action
    switch (op)
    {
    case OP3('O', 'C', 'B'):
    {
        TRACESTR("operator.c: OCB.");
        DONE("operator.c: OCB.");
    }
    case OP3('O', 'C', 'S'):
    {
        TRACESTR("operator.c: OCS.");
        DONE("operator.c: OCS.");
    }
    default:
    {
        NOPE("operator.c: Unknown operation.");
    }
    }

    return 0;
}
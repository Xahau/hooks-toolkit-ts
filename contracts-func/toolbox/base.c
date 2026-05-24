#include "hookapi.h"

int64_t func_one(uint32_t reserved) {
    TRACESTR("func_one.c: Called.");
    _g(1,1);
    return accept(SBUF("func_one: Finished."), __LINE__);
}

int64_t func_two(uint32_t reserved) {
    TRACESTR("func_two.c: Called.");
    _g(1,1);
    return accept(SBUF("func_two: Finished."), __LINE__);
}
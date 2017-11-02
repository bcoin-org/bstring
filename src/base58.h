#ifndef _BSTR_BASE58_H
#define _BSTR_BASE58_H

#include <stdlib.h>

bool
bstr_base58_encode(
  uint8_t **str,
  size_t *strlen,
  const uint8_t *data,
  size_t datalen
);

bool
bstr_base58_decode(
  uint8_t **data,
  size_t *datalen,
  const uint8_t *str,
  size_t strlen
);

#endif

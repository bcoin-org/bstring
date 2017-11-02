#ifndef _BSTR_BSTR_H
#define _BSTR_BSTR_H

#include <node.h>
#include <nan.h>

NAN_METHOD(base58_encode);
NAN_METHOD(base58_decode);
NAN_METHOD(bech32_encode);
NAN_METHOD(bech32_decode);

#endif

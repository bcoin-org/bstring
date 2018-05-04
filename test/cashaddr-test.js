// Parts of this software are based on "CashAddr".
// https://github.com/Bitcoin-ABC/bitcoin-abc
// Parts of this software are based on "bech32".
// https://github.com/sipa/bech32
//
// Copyright (c) 2017 Pieter Wuille
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const assert = require('./util/assert');
const base58 = require('../lib/base58');
const cashaddr = require('../lib/cashaddr');

const addressTranslationP2PKH = [
  {
    legacy: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
    cashaddr: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a'
  },
  {
    legacy: '1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR',
    cashaddr: 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy'
  },
  {
    legacy: '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb',
    cashaddr: 'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r'
  }
];

const addressTranslationP2SH = [
  {
    legacy: '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC',
    cashaddr: 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq'
  },
  {
    legacy: '3LDsS579y7sruadqu11beEJoTjdFiFCdX4',
    cashaddr: 'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e'
  },
  {
    legacy: '31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw',
    cashaddr: 'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37'
  }
];

describe('cashaddr', function() {
  for (const translation of addressTranslationP2PKH) {
    it(`should translate base58 P2PKH for ${translation.legacy}`, () => {
      const hash = base58.decode(translation.legacy).slice(1, -4);

      const prefix = 'bitcoincash';
      const type = 0;
      const addr = cashaddr.encode(prefix, type, hash);

      assert.strictEqual(addr, translation.cashaddr);
    });
  }

  for (const translation of addressTranslationP2SH) {
    it(`should translate base58 P2SH for ${translation.legacy}`, () => {
      const hash = base58.decode(translation.legacy).slice(1, -4);

      const prefix = 'bitcoincash';
      const type = 1;
      const addr = cashaddr.encode(prefix, type, hash);

      assert.strictEqual(addr, translation.cashaddr);
    });
  }
});

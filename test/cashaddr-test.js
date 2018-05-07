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

const testVectors = [
  {
    test: 'prefix:x64nx6hz',
    prefix: 'prefix',
    data: Buffer.alloc(0)
  },
  {
    test: 'p:gpf8m4h7',
    prefix: 'p',
    data: Buffer.alloc(0)
  },
  {
    test: 'bitcoincash:qpzry9x8gf2tvdw0s3jn54khce6mua7lcw20ayyn',
    prefix: 'bitcoincash',
    data: Buffer.from('000102030405060708090a0b0c0d0e0f101112131415161718191a'
      + '1b1c1d1e1f', 'hex')
  },
  {
    test: 'bchtest:testnetaddress4d6njnut',
    prefix: 'bchtest',
    data: Buffer.from('0b19100b13190b1d0d0d03191010', 'hex')
  },
  {
    test: 'bchreg:555555555555555555555555555555555555555555555udxmlmrz',
    prefix: 'bchreg',
    data: Buffer.from('1414141414141414141414141414141414141414141414141414141'
      + '41414141414141414141414141414141414', 'hex')
  }
];

const addressTranslationP2PKH = [
  {
    legacy: '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu',
    cashaddr: 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a',
    hash: Buffer.from('76a04053bda0a88bda5177b86a15c3b29f559873', 'hex')
  },
  {
    legacy: '1KXrWXciRDZUpQwQmuM1DbwsKDLYAYsVLR',
    cashaddr: 'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy',
    hash: Buffer.from('cb481232299cd5743151ac4b2d63ae198e7bb0a9', 'hex')
  },
  {
    legacy: '16w1D5WRVKJuZUsSRzdLp9w3YGcgoxDXb',
    cashaddr: 'bitcoincash:qqq3728yw0y47sqn6l2na30mcw6zm78dzqre909m2r',
    hash: Buffer.from('011f28e473c95f4013d7d53ec5fbc3b42df8ed10', 'hex')
  }
];

const addressTranslationP2SH = [
  {
    legacy: '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC',
    cashaddr: 'bitcoincash:ppm2qsznhks23z7629mms6s4cwef74vcwvn0h829pq',
    hash: Buffer.from('76a04053bda0a88bda5177b86a15c3b29f559873', 'hex')
  },
  {
    legacy: '3LDsS579y7sruadqu11beEJoTjdFiFCdX4',
    cashaddr: 'bitcoincash:pr95sy3j9xwd2ap32xkykttr4cvcu7as4yc93ky28e',
    hash: Buffer.from('cb481232299cd5743151ac4b2d63ae198e7bb0a9', 'hex')
  },
  {
    legacy: '31nwvkZwyPdgzjBJZXfDmSWsC4ZLKpYyUw',
    cashaddr: 'bitcoincash:pqq3728yw0y47sqn6l2na30mcw6zm78dzq5ucqzc37',
    hash: Buffer.from('011f28e473c95f4013d7d53ec5fbc3b42df8ed10', 'hex')
  }
];

describe('cashaddr', function() {
  for (const test of testVectors) {
    it(`should deserialize ${test.test}.`, () => {
      const [prefix, data] = cashaddr.deserialize(test.test);

      assert.strictEqual(prefix, test.prefix);
      assert.bufferEqual(data, test.data);
    });

    it(`should serialize ${test.test}.`, () => {
      const addr = cashaddr.serialize(test.prefix, test.data);
      assert.strictEqual(addr, test.test);
    });
  }

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

  for (const addrinfo of addressTranslationP2PKH) {
    it(`should decode P2PKH for ${addrinfo.cashaddr}`, () => {
      const addr = addrinfo.cashaddr;
      const results = cashaddr.decode(addr);

      assert.strictEqual(results.prefix, 'bitcoincash');
      assert.strictEqual(results.type, 0);
      assert.bufferEqual(results.hash, addrinfo.hash);
    });

    it(`should encode P2PKH for ${addrinfo.cashaddr}`, () => {
      const addr = cashaddr.encode('bitcoincash', 0, addrinfo.hash);

      assert.strictEqual(addr, addrinfo.cashaddr);
    });
  }

  for (const addrinfo of addressTranslationP2SH) {
    it(`should decode P2SH for ${addrinfo.cashaddr}`, () => {
      const addr = addrinfo.cashaddr;
      const results = cashaddr.decode(addr);

      assert.strictEqual(results.prefix, 'bitcoincash');
      assert.strictEqual(results.type, 1);
      assert.bufferEqual(results.hash, addrinfo.hash);
    });

    it(`should encode P2SH for ${addrinfo.cashaddr}`, () => {
      const addr = cashaddr.encode('bitcoincash', 1, addrinfo.hash);

      assert.strictEqual(addr, addrinfo.cashaddr);
    });
  }
});

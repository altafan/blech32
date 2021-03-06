const Module = require('../src/blech32');
const { malloc, charStar, stringStar, freeMalloc } = require('./utils');

module.exports = { encode, decode };

function encode(hrp, words, witVer = 0) {
  if (hrp !== 'el' && hrp !== 'lq') {
    throw new Error('Invalid prefix');
  }
  if (!Buffer.isBuffer(words) || words.length === 0) {
    throw new Error('Invalid words');
  }

  const res = malloc(1001);
  const res_len = malloc(4);

  const ret = Module.ccall(
    'addr_encode', 'number',
    [ 'number', 'number', 'number', 'number', 'number', 'number' ],
    [ res, res_len, stringStar(hrp), witVer, charStar(words), words.length ]
  );
  if(ret === 1) {
    const address = new Uint8Array(
      Module.HEAPU8.subarray(res, res + Module.getValue(res_len, 'i32'))
    );
    freeMalloc();
    return Buffer.from(address).toString();
  } else {
    freeMalloc();
    throw new Error('encode', ret);
  }
}

function decode(hrp, address) {
  const witVer = malloc(4);
  const program = malloc(1000);
  const programLen = malloc(8);
  const ret = Module.ccall(
    'addr_decode', 'number',
    [ 'number', 'number', 'number', 'number', 'number' ],
    [ witVer, program, programLen, stringStar(hrp), stringStar(address) ]
  );
  if (ret === 1) {
    const version = Module.getValue(witVer, 'i32');
    const words = Buffer.from(
      new Uint8Array(
        Module.HEAPU8.subarray(
          program,
          program + Module.getValue(programLen, 'i64')
        )
      )
    );
    freeMalloc();
    return { version, words };
  } else {
    freeMalloc();
    throw new Error('decode', ret);
  }
}
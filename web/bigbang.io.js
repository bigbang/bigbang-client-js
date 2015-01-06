!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.BigBang=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":2,"ieee754":3,"is-array":4}],2:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],3:[function(require,module,exports){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],4:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],5:[function(require,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var pew = require("./PewRuntime");
var wire = require("./WireProtocol.Protocol");

var SimpleEventEmitter = (function () {
    function SimpleEventEmitter() {
        this._listeners = {};
    }
    SimpleEventEmitter.prototype.on = function (event, listener) {
        var listeners = this._listeners[event];
        if (!listeners) {
            this._listeners[event] = listeners = [];
        }
        listeners.push(listener);
    };

    SimpleEventEmitter.prototype.emit = function (event, arg1, arg2, arg3) {
        var listeners = this._listeners[event];
        if (!listeners) {
            return;
        }
        listeners.forEach(function (listener) {
            listener(arg1, arg2, arg3);
        });
    };
    return SimpleEventEmitter;
})();
exports.SimpleEventEmitter = SimpleEventEmitter;


var LoginResult = (function () {
    function LoginResult() {
    }
    return LoginResult;
})();
exports.LoginResult = LoginResult;

var ConnectionError = (function () {
    function ConnectionError(msg) {
        this.message = msg;
    }
    ConnectionError.prototype.toString = function () {
        return this.message;
    };
    return ConnectionError;
})();
exports.ConnectionError = ConnectionError;

var ConnectionResult = (function () {
    function ConnectionResult() {
    }
    return ConnectionResult;
})();
exports.ConnectionResult = ConnectionResult;

var ResponseWrapper = (function () {
    function ResponseWrapper() {
    }
    return ResponseWrapper;
})();

var ChannelError = (function () {
    function ChannelError(msg) {
        this.message = msg;
    }
    ChannelError.prototype.toString = function () {
        return this.message;
    };
    return ChannelError;
})();
exports.ChannelError = ChannelError;

var ChannelMessage = (function () {
    function ChannelMessage() {
    }
    return ChannelMessage;
})();
exports.ChannelMessage = ChannelMessage;

var Channel = (function (_super) {
    __extends(Channel, _super);
    function Channel(client, name) {
        var _this = this;
        _super.call(this);
        this.unsubscribeCallback = null;
        this.client = client;
        this.name = name;
        this.responses = {};
        this.keySpaces = {};
        this.channelPermissions = [];
        this.currentSubscribers = [];

        this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
        this.keySpaces["def"] = new ChannelData(client, "def", this);

        this.metaKeyspace().on("subs", function (doc) {
            var self = _this;
            var oldSubs = _this.currentSubscribers;
            _this.currentSubscribers = _this.getSubscribers();

            var diff = _this.diff(oldSubs, _this.getSubscribers());

            diff.forEach(function (id) {
                if (oldSubs.indexOf(id) != -1) {
                    self.emit('leave', id);
                } else {
                    self.emit('join', id);
                }
            });
        });
    }
    Channel.prototype.getName = function () {
        return this.name;
    };

    Channel.prototype.getChannelData = function (namespace) {
        namespace = namespace || 'def';
        return this.getOrCreateChannelData(namespace);
    };

    Channel.prototype.getSubscribers = function () {
        var subs = [];
        var doc = this.metaKeyspace().get("subs");

        if (doc) {
            var subsAry = doc.subs;

            subsAry.forEach(function (id) {
                subs.push(id);
            });
        }
        return subs;
    };

    Channel.prototype.getNamespaces = function () {
        var names = [];

        Object.keys(this.keySpaces).forEach(function (key) {
            if (key !== '_meta') {
                names.push(key);
            }
        });

        return names;
    };

    Channel.prototype.publish = function (payload, callback) {
        if (this.hasPermission("Publish")) {
            this.publishByteArray(new pew.ByteArray(pew.base64_encode(JSON.stringify(payload))));
            if (callback) {
                var err = null;
                callback(err);
            }
        } else {
            if (callback) {
                callback(new ChannelError("No permission to publish on channel."));
            }
        }
    };

    Channel.prototype.unsubscribe = function (callback) {
        var msg = new wire.WireChannelUnSubscribe();
        msg.name = this.getName();
        this.client.sendToServer(msg);
        this.unsubscribeCallback = callback;
    };

    Channel.prototype.onWireChannelMessage = function (msg) {
        var channelMessage = new ChannelMessage();
        channelMessage.channel = this;
        channelMessage.payload = msg.payload;
        channelMessage.senderId = msg.senderId;
        this.emit('message', channelMessage);
    };

    Channel.prototype.onWireQueueMessage = function (msg) {
        if (msg.id) {
            var wrapper = this.responses[msg.id];

            if (wrapper) {
                delete this.responses[msg.id];

                if (wrapper.type == "json") {
                    wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));
                } else if (wrapper.type == "bytes") {
                } else if (wrapper.type == "string") {
                } else {
                    console.error("Failed wire queue message.");
                }
            }
        } else {
            console.error("Error mapping response id " + msg.id);
        }
    };

    Channel.prototype.onWireChannelDataCreate = function (msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
    };

    Channel.prototype.onWireChannelDataUpdate = function (msg) {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
    };

    Channel.prototype.onWireChannelDataDelete = function (msg) {
        var channelData = this.getOrCreateChannelData(msg.ks);

        channelData.onWireChannelDataDelete(msg);

        if (channelData.getKeys().length == 0) {
            delete this.keySpaces[msg.ks];
        }
    };

    Channel.prototype.onWireChannelLeave = function (msg) {
        if (this.unsubscribeCallback) {
            this.unsubscribeCallback();
        }
    };

    Channel.prototype.setChannelPermissions = function (perms) {
        this.channelPermissions = perms;
    };

    Channel.prototype.hasPermission = function (p) {
        var ret = false;

        this.channelPermissions.forEach(function (perm) {
            if (p == perm) {
                ret = true;
            }
        });

        return ret;
    };

    Channel.prototype.diff = function (a1, a2) {
        var a = [], diff = [];
        for (var i = 0; i < a1.length; i++)
            a[a1[i]] = true;
        for (var i = 0; i < a2.length; i++)
            if (a[a2[i]])
                delete a[a2[i]];
            else
                a[a2[i]] = true;
        for (var k in a)
            diff.push(k);
        return diff;
    };

    Channel.prototype.listChanged = function (orig, current) {
        var result = [];

        orig.forEach(function (key) {
            if (-1 === current.indexOf(key)) {
                result.push(key);
            }
        }, this);

        return result;
    };

    Channel.prototype.metaKeyspace = function () {
        return this.keySpaces["_meta"];
    };

    Channel.prototype.publishByteArray = function (payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = this.name;
        msg.payload = payload;
        this.client.sendToServer(msg);
    };

    Channel.prototype.getOrCreateChannelData = function (ks) {
        var cd;

        if (!ks || "def" == ks) {
            cd = this.keySpaces["def"];
        } else {
            cd = this.keySpaces[ks];
        }

        if (!cd) {
            cd = new ChannelData(this.client, ks, this);
            this.keySpaces[ks] = cd;
        }
        return cd;
    };
    return Channel;
})(SimpleEventEmitter);
exports.Channel = Channel;

var ChannelData = (function (_super) {
    __extends(ChannelData, _super);
    function ChannelData(client, keySpace, channel) {
        _super.call(this);
        this.client = client;
        this.keySpace = keySpace;
        this.elementMap = {};
        this.channel = channel;
        this.onWireChannelDataCreate.bind(this);
        this.onWireChannelDataDelete.bind(this);
        this.onWireChannelDataUpdate.bind(this);
    }
    ChannelData.prototype.get = function (key) {
        return this.elementMap[key];
    };

    ChannelData.prototype.put = function (key, value, callback) {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        } else if (!value) {
            callback(new ChannelError("ChannelData value cannot be null."));
            return;
        }

        if (this.channel.hasPermission("PutChannelData")) {
            var msg = new wire.WireChannelDataPut();
            msg.key = key;
            msg.ks = this.keySpace;
            msg.name = this.channel.getName();
            msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(value)));
            this.client.sendToServer(msg);

            if (callback) {
                callback(null);
            }
        } else {
            if (callback) {
                callback(new ChannelError("No permission to put on this channel."));
            }
        }
    };

    ChannelData.prototype.remove = function (key, callback) {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }

        if (this.channel.hasPermission("DelChannelData")) {
            var del = new wire.WireChannelDataDel();
            del.key = key;
            del.ks = this.keySpace;
            del.name = this.channel.getName();
            this.client.sendToServer(del);

            if (callback) {
                callback(null);
            }
        } else {
            if (callback) {
                callback(new ChannelError("No permission to del on this channel."));
            }
        }
    };

    ChannelData.prototype.getKeys = function () {
        var keys = [];

        for (var k in this.elementMap) {
            keys.push(k);
        }
        return keys;
    };

    ChannelData.prototype.onWireChannelDataCreate = function (msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('add', msg.key, o);
        this.emit(msg.key, o, 'add');
    };

    ChannelData.prototype.onWireChannelDataUpdate = function (msg) {
        var payload = msg.payload.getBytesAsUTF8();
        var o = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('update', msg.key, o);
        this.emit(msg.key, o, 'update');
    };

    ChannelData.prototype.onWireChannelDataDelete = function (msg) {
        delete this.elementMap[msg.key];
        this.emit('remove', msg.key);
        this.emit(msg.key, null, 'remove');
    };
    return ChannelData;
})(SimpleEventEmitter);
exports.ChannelData = ChannelData;

var AbstractBigBangClient = (function (_super) {
    __extends(AbstractBigBangClient, _super);
    function AbstractBigBangClient() {
        _super.call(this);
        this.bufString = "";
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};
    }
    AbstractBigBangClient.prototype.connect = function (url, options, callback) {
        throw new Error("abstract");
    };

    AbstractBigBangClient.prototype.disconnect = function () {
        this.sendToServer(new wire.WireDisconnectRequest());
    };

    AbstractBigBangClient.prototype.subscribe = function (channel, options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        this.channelSubscribeMap[channel] = callback;
        var msg = new wire.WireChannelSubscribe();
        msg.name = channel;
        this.sendToServer(msg);
    };

    AbstractBigBangClient.prototype.getClientId = function () {
        return this._clientId;
    };

    AbstractBigBangClient.prototype.getChannel = function (channel) {
        return this.channelMap[channel];
    };

    AbstractBigBangClient.prototype.sendToServer = function (msg) {
        throw new Error("Unimplemented: sendToServer");
    };

    AbstractBigBangClient.prototype.onConnect = function () {
        var req = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    };

    AbstractBigBangClient.prototype.publish = function (channel, payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    };

    AbstractBigBangClient.prototype.onReceiveText = function (data) {
        this.bufString += data;
        while (this.parseTextStream()) {
        }
    };

    AbstractBigBangClient.prototype.parseTextStream = function () {
        var delimIdx = this.bufString.indexOf(":");

        if (delimIdx != -1) {
            var lenStr = this.bufString.substr(0, delimIdx);
            var msgLen = parseInt(lenStr);

            if (this.bufString.length < msgLen + 1 + delimIdx) {
                return false;
            } else {
                var body = this.bufString.substr(delimIdx + 1, msgLen + 1);

                var c = body.charAt(body.length - 1);
                if (c != ',') {
                    console.error("TextProtocol decode exception, not terminated with comma");
                }

                var actualBody = body.substr(0, body.length - 1);

                this.wireProtocol.dispatchNetstring(actualBody);

                if (this.bufString.length > msgLen + 1 + delimIdx + 1) {
                    var left = this.bufString.substr(msgLen + 1 + delimIdx + 1);
                    this.bufString = left;
                    return true;
                } else {
                    this.bufString = "";
                    return false;
                }
            }
        } else {
            return false;
        }
    };

    AbstractBigBangClient.prototype.onWireChannelJoin = function (msg) {
        var callback = this.channelSubscribeMap[msg.name];

        var channel = new Channel(this, msg.name);
        channel.setChannelPermissions(msg.channelPermissions);

        this.channelMap[channel.getName()] = channel;

        if (!msg.success) {
            if (callback) {
                return callback(new ChannelError("Unable to join channel"), channel);
            }
        }

        if (callback) {
            callback(null, channel);
        }
    };

    AbstractBigBangClient.prototype.onWireChannelLeave = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelLeave(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelMessage = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    };

    AbstractBigBangClient.prototype.onWireQueueMessage = function (msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    };

    AbstractBigBangClient.prototype.onWireRpcMessage = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireConnectFailure = function (msg) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    };

    AbstractBigBangClient.prototype.onWireConnectSuccess = function (msg) {
        this._clientId = msg.clientId;
        var cr = new ConnectionResult();
        cr.clientId = msg.clientId;
        cr.success = true;
        cr.message = null;
        this._internalConnectionResult(null, cr);

        setInterval(function () {
            this.sendToServer(new wire.WirePing());
        }.bind(this), msg.clientToServerPingMS);
    };

    AbstractBigBangClient.prototype.onWireChannelDataCreate = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataCreate(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataUpdate = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataUpdate(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataDelete = function (msg) {
        var channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataDelete(msg);
    };

    AbstractBigBangClient.prototype.onWireChannelDataDel = function (msg) {
        console.log('Unimplemented: onWireChannelDataDel');
    };

    AbstractBigBangClient.prototype.onWireChannelDataPut = function (msg) {
        console.log('Unimplemented: onWireChannelDataPut');
    };

    AbstractBigBangClient.prototype.onWireDisconnectSuccess = function (msg) {
        this.emit('disconnected', false);
    };

    AbstractBigBangClient.prototype.onWireChannelUnSubscribe = function (msg) {
        console.log("Unimplemented: onWireChannelUnSubscribe");
    };

    AbstractBigBangClient.prototype.onWireDisconnectRequest = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireConnectRequest = function (msg) {
    };

    AbstractBigBangClient.prototype.onWireChannelSubscribe = function (msg) {
        console.log('Unimplemented: onWireChannelSubscribe');
    };

    AbstractBigBangClient.prototype.onWirePing = function (msg) {
        this.sendToServer(new wire.WirePong());
    };

    AbstractBigBangClient.prototype.onWirePong = function (msg) {
    };

    AbstractBigBangClient.prototype.parseUrl = function (url) {
        url = url.replace(/\//g, '');
        var comps = url.split(':');
        var protocol = comps[0];
        var host = comps[1];
        var port = Number(comps[2]) || (protocol === 'http' ? 80 : 443);
        return {
            protocol: protocol,
            host: host,
            port: port
        };
    };
    return AbstractBigBangClient;
})(SimpleEventEmitter);
exports.AbstractBigBangClient = AbstractBigBangClient;

},{"./PewRuntime":7,"./WireProtocol.Protocol":8}],6:[function(require,module,exports){
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var bigbang = require("./BigBangClient");

var Client = (function (_super) {
    __extends(Client, _super);
    function Client() {
        _super.call(this);
    }
    Client.prototype.connect = function (url, options, callback) {
        var _this = this;
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        if (url instanceof Object) {
            options = url;
            url = null;
        }

        var parsedUrl = this.parseUrl(url);

        var host = parsedUrl.host;
        host += ':' + parsedUrl.port;
        var user = null;
        var password = null;

        this.internalLogin(parsedUrl.protocol, host, user, password, host, function (loginResult) {
            if (loginResult.authenticated) {
                _this.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
            } else {
                var err = new bigbang.ConnectionError(loginResult.message);
                callback(err);
            }
        });
    };

    Client.prototype.internalLogin = function (protocol, host, user, password, application, callback) {
        var hostname = host.split(":")[0];
        var port = host.split(":")[1];

        var protocolHash = this.wireProtocol.protocolHash;

        var uri = protocol + "://" + hostname + ":" + port;

        if (!user && !password) {
            uri += "/loginAnon?application=" + application + "&wireprotocolhash=" + protocolHash;
        } else {
            uri += "/login?username=" + user + "&password=" + password + "&application=" + application + "&wireprotocolhash=" + protocolHash;
        }

        var xhr = this.createCORSRequest('GET', uri);
        if (!xhr) {
            var loginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'CORS not supported';

            return callback(loginResult);
            return;
        }

        xhr.onload = function () {
            var loginResult = new bigbang.LoginResult();

            var json = null;

            try  {
                json = JSON.parse(xhr.responseText);
                loginResult.authenticated = json.authenticated;
                loginResult.clientKey = json.clientKey;
                loginResult.message = json.message;

                callback(loginResult);
            } catch (e) {
                loginResult.authenticated = false;
                loginResult.message = e.message;
                callback(loginResult);
            }
        };

        xhr.onerror = function () {
            var loginResult = new bigbang.LoginResult();

            loginResult.authenticated = false;
            loginResult.message = 'XHR error';

            return callback(loginResult);
        };

        xhr.send();
    };

    Client.prototype.internalConnect = function (protocol, host, clientKey, callback) {
        var _this = this;
        this._internalConnectionResult = callback;
        this._clientKey = clientKey;

        var ws;

        if (protocol === "https") {
            ws = "wss://" + host + "/";
        } else {
            ws = "ws://" + host + "/";
        }

        this.socket = new WebSocket(ws);

        this.socket.onopen = function (event) {
            setTimeout(function () {
                _this.onConnect();
            }, 0);
        };

        this.socket.onmessage = function (event) {
            var s = event.data.toString();
            _this.onReceiveText(s);
        };

        this.socket.onclose = function (event) {
            _this.emit('disconnected', false);
        };

        this.socket.onerror = function (event) {
            console.error("WebSocket error: " + event);
        };
    };

    Client.prototype.sendToServer = function (msg) {
        var s = this.wireProtocol.wrapNetstring(msg);
        if (this.socket) {
            this.socket.send(s);
        } else {
            console.error("Send while socket is null.");
        }
    };

    Client.prototype.onDisconnect = function (notify) {
        if (!notify) {
            this.socket.onclose = null;
        }

        this.socket.close();
    };

    Client.prototype.createCORSRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            console.log("Not capturing XDomainRequest just yet..");
            throw new Error("Error, XDomainRequest support!");
        } else {
            xhr = null;
        }
        return xhr;
    };
    return Client;
})(bigbang.AbstractBigBangClient);
exports.Client = Client;

},{"./BigBangClient":5}],7:[function(require,module,exports){
(function (global,Buffer){
global.Buffer = Buffer;

var ByteArray = (function () {
    function ByteArray(payload) {
        if (payload) {
            if (payload instanceof String) {
                this.buffer = new Buffer(payload, 'utf8');
            } else {
                this.buffer = payload;
            }
        } else {
            this.buffer = new Buffer(0);
        }
    }
    ByteArray.prototype.getBytesAsBase64 = function () {
        return this.buffer.toString('utf8');
    };

    ByteArray.prototype.getBytesAsUTF8 = function () {
        return exports.base64_decode(this.buffer.toString('utf8'));
    };

    ByteArray.prototype.getBytesAsJSON = function () {
        return JSON.parse(this.getBytesAsUTF8());
    };

    ByteArray.prototype.getBuffer = function () {
        return this.buffer;
    };

    ByteArray.prototype.toJSON = function () {
        return this.getBytesAsBase64();
    };
    return ByteArray;
})();
exports.ByteArray = ByteArray;

function encodeNetstring(s) {
    return s.length + ":" + s + ",";
}
exports.encodeNetstring = encodeNetstring;

function decodeNetstring(s) {
    var idx = s.indexOf(":");
    var msgStr = s.substr(idx + 1);
    return msgStr.substr(0, msgStr.length - 1);
}
exports.decodeNetstring = decodeNetstring;

function base64_encode(data) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc = "", tmp_arr = [];

    if (!data) {
        return data;
    }

    do {
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while(i < data.length);

    enc = tmp_arr.join('');

    var r = data.length % 3;

    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}
exports.base64_encode = base64_encode;

var b64_decode_fast_hash = {};
var b64_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";

for (var i = 0; i < b64_charset.length; i++) {
    b64_decode_fast_hash[b64_charset.charAt(i)] = i;
}

function base64_decode(data) {
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];

    if (!data) {
        return data;
    }

    do {
        h1 = b64_decode_fast_hash[data.charAt(i++)];
        h2 = b64_decode_fast_hash[data.charAt(i++)];
        h3 = b64_decode_fast_hash[data.charAt(i++)];
        h4 = b64_decode_fast_hash[data.charAt(i++)];

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while(i < data.length);

    dec = tmp_arr.join('');

    return dec;
}
exports.base64_decode = base64_decode;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":1}],8:[function(require,module,exports){
var pew = require("./PewRuntime");

var WireProtocol = (function () {
    function WireProtocol() {
        this.protocolId = 0;
        this.protocolHash = 'd96a44664eff8b2a710ded18e07ab927';
    }
    WireProtocol.prototype.wrapNetstring = function (msg) {
        var msgStr = msg.messageType + ":" + msg.serializeJson();
        return pew.encodeNetstring(msgStr);
    };

    WireProtocol.prototype.dispatchNetstring = function (s) {
        var idx = s.indexOf(":");
        var msgBody = s.substr(idx + 1);
        var t = parseInt(s.substr(0, idx));

        switch (t) {
            case 0:
                var WireChannelDataCreate_msg = new WireChannelDataCreate();
                WireChannelDataCreate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataCreate(WireChannelDataCreate_msg);

                break;
            case 1:
                var WireChannelDataDel_msg = new WireChannelDataDel();
                WireChannelDataDel_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDel(WireChannelDataDel_msg);

                break;
            case 2:
                var WireChannelDataDelete_msg = new WireChannelDataDelete();
                WireChannelDataDelete_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataDelete(WireChannelDataDelete_msg);

                break;
            case 3:
                var WireChannelDataPut_msg = new WireChannelDataPut();
                WireChannelDataPut_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataPut(WireChannelDataPut_msg);

                break;
            case 4:
                var WireChannelDataUpdate_msg = new WireChannelDataUpdate();
                WireChannelDataUpdate_msg.deserializeJson(msgBody);
                this.listener.onWireChannelDataUpdate(WireChannelDataUpdate_msg);

                break;
            case 5:
                var WireChannelJoin_msg = new WireChannelJoin();
                WireChannelJoin_msg.deserializeJson(msgBody);
                this.listener.onWireChannelJoin(WireChannelJoin_msg);

                break;
            case 6:
                var WireChannelLeave_msg = new WireChannelLeave();
                WireChannelLeave_msg.deserializeJson(msgBody);
                this.listener.onWireChannelLeave(WireChannelLeave_msg);

                break;
            case 7:
                var WireChannelMessage_msg = new WireChannelMessage();
                WireChannelMessage_msg.deserializeJson(msgBody);
                this.listener.onWireChannelMessage(WireChannelMessage_msg);

                break;
            case 8:
                var WireChannelSubscribe_msg = new WireChannelSubscribe();
                WireChannelSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelSubscribe(WireChannelSubscribe_msg);

                break;
            case 9:
                var WireChannelUnSubscribe_msg = new WireChannelUnSubscribe();
                WireChannelUnSubscribe_msg.deserializeJson(msgBody);
                this.listener.onWireChannelUnSubscribe(WireChannelUnSubscribe_msg);

                break;
            case 10:
                var WireConnectFailure_msg = new WireConnectFailure();
                WireConnectFailure_msg.deserializeJson(msgBody);
                this.listener.onWireConnectFailure(WireConnectFailure_msg);

                break;
            case 11:
                var WireConnectRequest_msg = new WireConnectRequest();
                WireConnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireConnectRequest(WireConnectRequest_msg);

                break;
            case 12:
                var WireConnectSuccess_msg = new WireConnectSuccess();
                WireConnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireConnectSuccess(WireConnectSuccess_msg);

                break;
            case 13:
                var WireDisconnectRequest_msg = new WireDisconnectRequest();
                WireDisconnectRequest_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectRequest(WireDisconnectRequest_msg);

                break;
            case 14:
                var WireDisconnectSuccess_msg = new WireDisconnectSuccess();
                WireDisconnectSuccess_msg.deserializeJson(msgBody);
                this.listener.onWireDisconnectSuccess(WireDisconnectSuccess_msg);

                break;
            case 15:
                var WirePing_msg = new WirePing();
                WirePing_msg.deserializeJson(msgBody);
                this.listener.onWirePing(WirePing_msg);

                break;
            case 16:
                var WirePong_msg = new WirePong();
                WirePong_msg.deserializeJson(msgBody);
                this.listener.onWirePong(WirePong_msg);

                break;
            case 17:
                var WireQueueMessage_msg = new WireQueueMessage();
                WireQueueMessage_msg.deserializeJson(msgBody);
                this.listener.onWireQueueMessage(WireQueueMessage_msg);

                break;
            case 18:
                var WireRpcMessage_msg = new WireRpcMessage();
                WireRpcMessage_msg.deserializeJson(msgBody);
                this.listener.onWireRpcMessage(WireRpcMessage_msg);

                break;
        }
    };
    return WireProtocol;
})();
exports.WireProtocol = WireProtocol;

var WireChannelDataCreate = (function () {
    function WireChannelDataCreate() {
        this.messageType = 0;
    }
    WireChannelDataCreate.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataCreate.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataCreate.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataCreate.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataCreate.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataCreate.key_IS_SET = 1 << 0;
    WireChannelDataCreate.ks_IS_SET = 1 << 1;
    WireChannelDataCreate.name_IS_SET = 1 << 2;
    WireChannelDataCreate.payload_IS_SET = 1 << 3;
    return WireChannelDataCreate;
})();
exports.WireChannelDataCreate = WireChannelDataCreate;
var WireChannelDataDel = (function () {
    function WireChannelDataDel() {
        this.messageType = 1;
    }
    WireChannelDataDel.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataDel.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
    };

    WireChannelDataDel.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataDel.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataDel.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataDel.key_IS_SET = 1 << 0;
    WireChannelDataDel.ks_IS_SET = 1 << 1;
    WireChannelDataDel.name_IS_SET = 1 << 2;
    return WireChannelDataDel;
})();
exports.WireChannelDataDel = WireChannelDataDel;
var WireChannelDataDelete = (function () {
    function WireChannelDataDelete() {
        this.messageType = 2;
    }
    WireChannelDataDelete.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataDelete.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataDelete.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataDelete.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataDelete.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataDelete.key_IS_SET = 1 << 0;
    WireChannelDataDelete.ks_IS_SET = 1 << 1;
    WireChannelDataDelete.name_IS_SET = 1 << 2;
    WireChannelDataDelete.payload_IS_SET = 1 << 3;
    return WireChannelDataDelete;
})();
exports.WireChannelDataDelete = WireChannelDataDelete;
var WireChannelDataPut = (function () {
    function WireChannelDataPut() {
        this.messageType = 3;
    }
    WireChannelDataPut.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataPut.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataPut.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataPut.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataPut.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataPut.key_IS_SET = 1 << 0;
    WireChannelDataPut.ks_IS_SET = 1 << 1;
    WireChannelDataPut.name_IS_SET = 1 << 2;
    WireChannelDataPut.payload_IS_SET = 1 << 3;
    return WireChannelDataPut;
})();
exports.WireChannelDataPut = WireChannelDataPut;
var WireChannelDataUpdate = (function () {
    function WireChannelDataUpdate() {
        this.messageType = 4;
    }
    WireChannelDataUpdate.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelDataUpdate.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.key = obj.key;
        this.ks = obj.ks;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelDataUpdate.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelDataUpdate.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelDataUpdate.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelDataUpdate.key_IS_SET = 1 << 0;
    WireChannelDataUpdate.ks_IS_SET = 1 << 1;
    WireChannelDataUpdate.name_IS_SET = 1 << 2;
    WireChannelDataUpdate.payload_IS_SET = 1 << 3;
    return WireChannelDataUpdate;
})();
exports.WireChannelDataUpdate = WireChannelDataUpdate;
var WireChannelJoin = (function () {
    function WireChannelJoin() {
        this.messageType = 5;
    }
    WireChannelJoin.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelJoin.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.success = obj.success;

        this.channelPermissions = obj.channelPermissions;

        this.errorMessage = obj.errorMessage;
    };

    WireChannelJoin.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelJoin.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelJoin.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelJoin.name_IS_SET = 1 << 0;
    WireChannelJoin.success_IS_SET = 1 << 1;
    WireChannelJoin.channelPermissions_IS_SET = 1 << 2;
    WireChannelJoin.errorMessage_IS_SET = 1 << 3;
    return WireChannelJoin;
})();
exports.WireChannelJoin = WireChannelJoin;
var WireChannelLeave = (function () {
    function WireChannelLeave() {
        this.messageType = 6;
    }
    WireChannelLeave.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelLeave.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    };

    WireChannelLeave.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelLeave.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelLeave.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelLeave.name_IS_SET = 1 << 0;
    return WireChannelLeave;
})();
exports.WireChannelLeave = WireChannelLeave;
var WireChannelMessage = (function () {
    function WireChannelMessage() {
        this.messageType = 7;
    }
    WireChannelMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.senderId = obj.senderId;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireChannelMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelMessage.senderId_IS_SET = 1 << 0;
    WireChannelMessage.name_IS_SET = 1 << 1;
    WireChannelMessage.payload_IS_SET = 1 << 2;
    return WireChannelMessage;
})();
exports.WireChannelMessage = WireChannelMessage;
var WireChannelSubscribe = (function () {
    function WireChannelSubscribe() {
        this.messageType = 8;
    }
    WireChannelSubscribe.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelSubscribe.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
        this.jsonConfig = obj.jsonConfig;
    };

    WireChannelSubscribe.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelSubscribe.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelSubscribe.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelSubscribe.name_IS_SET = 1 << 0;
    WireChannelSubscribe.jsonConfig_IS_SET = 1 << 1;
    return WireChannelSubscribe;
})();
exports.WireChannelSubscribe = WireChannelSubscribe;
var WireChannelUnSubscribe = (function () {
    function WireChannelUnSubscribe() {
        this.messageType = 9;
    }
    WireChannelUnSubscribe.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireChannelUnSubscribe.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.name = obj.name;
    };

    WireChannelUnSubscribe.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireChannelUnSubscribe.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireChannelUnSubscribe.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireChannelUnSubscribe.name_IS_SET = 1 << 0;
    return WireChannelUnSubscribe;
})();
exports.WireChannelUnSubscribe = WireChannelUnSubscribe;
var WireConnectFailure = (function () {
    function WireConnectFailure() {
        this.messageType = 10;
    }
    WireConnectFailure.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectFailure.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.failureMessage = obj.failureMessage;
    };

    WireConnectFailure.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectFailure.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectFailure.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectFailure.failureMessage_IS_SET = 1 << 0;
    return WireConnectFailure;
})();
exports.WireConnectFailure = WireConnectFailure;
var WireConnectRequest = (function () {
    function WireConnectRequest() {
        this.messageType = 11;
    }
    WireConnectRequest.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectRequest.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.version = obj.version;
        this.clientKey = obj.clientKey;
    };

    WireConnectRequest.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectRequest.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectRequest.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectRequest.version_IS_SET = 1 << 0;
    WireConnectRequest.clientKey_IS_SET = 1 << 1;
    return WireConnectRequest;
})();
exports.WireConnectRequest = WireConnectRequest;
var WireConnectSuccess = (function () {
    function WireConnectSuccess() {
        this.messageType = 12;
    }
    WireConnectSuccess.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireConnectSuccess.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.clientId = obj.clientId;
        this.clientToServerPingMS = obj.clientToServerPingMS;
    };

    WireConnectSuccess.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireConnectSuccess.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireConnectSuccess.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireConnectSuccess.clientId_IS_SET = 1 << 0;
    WireConnectSuccess.clientToServerPingMS_IS_SET = 1 << 1;
    return WireConnectSuccess;
})();
exports.WireConnectSuccess = WireConnectSuccess;
var WireDisconnectRequest = (function () {
    function WireDisconnectRequest() {
        this.messageType = 13;
    }
    WireDisconnectRequest.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireDisconnectRequest.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WireDisconnectRequest.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireDisconnectRequest.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireDisconnectRequest.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WireDisconnectRequest;
})();
exports.WireDisconnectRequest = WireDisconnectRequest;
var WireDisconnectSuccess = (function () {
    function WireDisconnectSuccess() {
        this.messageType = 14;
    }
    WireDisconnectSuccess.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireDisconnectSuccess.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WireDisconnectSuccess.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireDisconnectSuccess.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireDisconnectSuccess.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WireDisconnectSuccess;
})();
exports.WireDisconnectSuccess = WireDisconnectSuccess;
var WirePing = (function () {
    function WirePing() {
        this.messageType = 15;
    }
    WirePing.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WirePing.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WirePing.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WirePing.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WirePing.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WirePing;
})();
exports.WirePing = WirePing;
var WirePong = (function () {
    function WirePong() {
        this.messageType = 16;
    }
    WirePong.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WirePong.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
    };

    WirePong.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WirePong.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WirePong.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    return WirePong;
})();
exports.WirePong = WirePong;
var WireQueueMessage = (function () {
    function WireQueueMessage() {
        this.messageType = 17;
    }
    WireQueueMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireQueueMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.name = obj.name;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireQueueMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireQueueMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireQueueMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireQueueMessage.id_IS_SET = 1 << 0;
    WireQueueMessage.name_IS_SET = 1 << 1;
    WireQueueMessage.payload_IS_SET = 1 << 2;
    return WireQueueMessage;
})();
exports.WireQueueMessage = WireQueueMessage;
var WireRpcMessage = (function () {
    function WireRpcMessage() {
        this.messageType = 18;
    }
    WireRpcMessage.prototype.serializeJson = function () {
        return JSON.stringify(this);
    };

    WireRpcMessage.prototype.deserializeJson = function (json) {
        var obj = JSON.parse(json);
        this.id = obj.id;
        this.ns = obj.ns;
        this.payload = new pew.ByteArray(obj.payload);
    };

    WireRpcMessage.prototype.setPewBitmask = function (flag) {
        this._pew_bitmask_ |= flag;
    };

    WireRpcMessage.prototype.unsetPewBitmask = function (flag) {
        this._pew_bitmask_ &= flag;
    };

    WireRpcMessage.prototype.pewBitmaskIsSetFor = function (flag) {
        return (this._pew_bitmask_ & flag) == flag;
    };
    WireRpcMessage.id_IS_SET = 1 << 0;
    WireRpcMessage.ns_IS_SET = 1 << 1;
    WireRpcMessage.payload_IS_SET = 1 << 2;
    return WireRpcMessage;
})();
exports.WireRpcMessage = WireRpcMessage;

},{"./PewRuntime":7}]},{},[6])(6)
});
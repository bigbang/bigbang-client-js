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

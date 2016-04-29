var BigBang =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var url = __webpack_require__(1);
	var bigbang = __webpack_require__(7);

	var BrowserBigBangClient = function (_bigbang$AbstractBigB) {
	    _inherits(BrowserBigBangClient, _bigbang$AbstractBigB);

	    function BrowserBigBangClient(appUrl) {
	        _classCallCheck(this, BrowserBigBangClient);

	        return _possibleConstructorReturn(this, Object.getPrototypeOf(BrowserBigBangClient).call(this, appUrl));
	    }

	    _createClass(BrowserBigBangClient, [{
	        key: "connect",
	        value: function connect(callback) {
	            var _this2 = this;

	            var parsedUrl = this.parseUrl(this._appUrl);
	            var host = parsedUrl.host;
	            host += ':' + parsedUrl.port;
	            var user = null;
	            var password = null;
	            this.internalLogin(parsedUrl.protocol, host, user, password, host, function (loginResult) {
	                if (loginResult.authenticated) {
	                    _this2.internalConnect(parsedUrl.protocol, host, loginResult.clientKey, callback);
	                } else {
	                    var err = new bigbang.ConnectionError(loginResult.message);
	                    callback(err);
	                }
	            });
	        }
	    }, {
	        key: "connectAsDevice",
	        value: function connectAsDevice(id, secret, callback) {
	            var _this3 = this;

	            var parsedUrl = this.parseUrl(this._appUrl);
	            var host = parsedUrl.host;
	            host += ':' + parsedUrl.port;
	            this.authenticateDevice(id, secret, function (err, result) {
	                if (err) {
	                    callback(err);
	                    return;
	                }
	                if (result.authenticated) {
	                    _this3._deviceId = id;
	                    _this3.internalConnect(parsedUrl.protocol, host, result.clientKey, callback);
	                } else {
	                    callback(err);
	                    return;
	                }
	            });
	        }
	    }, {
	        key: "internalLogin",
	        value: function internalLogin(protocol, host, user, password, application, callback) {
	            if (!user && !password) {
	                this.authAnon(callback);
	            } else {
	                this.authUser(user, password, callback);
	            }
	        }
	    }, {
	        key: "internalConnect",
	        value: function internalConnect(protocol, host, clientKey, callback) {
	            var _this4 = this;

	            this._clientKey = clientKey;
	            //TODO could be more elegant here.
	            var deviceCalled = false;
	            if (this._deviceId) {
	                this._internalConnectionResult = function (cr) {
	                    _this4.getDeviceChannel(function (channel) {
	                        if (!deviceCalled) {
	                            if (cr.success) {
	                                deviceCalled = true;
	                                callback(null);
	                                return;
	                            } else {
	                                deviceCalled = true;
	                                callback(new bigbang.ConnectionError(cr.failureMessage));
	                                return;
	                            }
	                        }
	                    });
	                };
	            } else {
	                this._internalConnectionResult = function (cr) {
	                    if (cr.success) {
	                        callback(null);
	                        return;
	                    } else {
	                        callback(new bigbang.ConnectionError(cr.failureMessage));
	                        return;
	                    }
	                };
	            }
	            var ws;
	            if (protocol === "https") {
	                ws = "https://" + host + "/sjs";
	            } else {
	                ws = "http://" + host + "/sjs";
	            }
	            this.socket = new SockJS(ws);
	            this.socket.onopen = function (event) {
	                setTimeout(function () {
	                    _this4.onConnect();
	                }, 0);
	            };
	            this.socket.onmessage = function (event) {
	                var s = event.data.toString();
	                _this4.onReceiveText(s);
	            };
	            this.socket.onclose = function (event) {
	                _this4.emit('disconnected', false);
	            };
	        }
	    }, {
	        key: "sendToServer",
	        value: function sendToServer(msg) {
	            var s = this.wireProtocol.wrapNetstring(msg);
	            if (this.socket) {
	                this.socket.send(s);
	            } else {
	                console.error("Send while socket is null.");
	            }
	        }
	    }, {
	        key: "onDisconnect",
	        value: function onDisconnect(notify) {
	            if (!notify) {
	                this.socket.onclose = null;
	            }
	            this.socket.close();
	        }
	    }]);

	    return BrowserBigBangClient;
	}(bigbang.AbstractBigBangClient);

	module.exports = {
	    Client: BrowserBigBangClient
	};
	//# sourceMappingURL=BrowserBigBangClient.js.map


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var punycode = __webpack_require__(2);

	exports.parse = urlParse;
	exports.resolve = urlResolve;
	exports.resolveObject = urlResolveObject;
	exports.format = urlFormat;

	exports.Url = Url;

	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	    portPattern = /:[0-9]*$/,

	    // RFC 2396: characters reserved for delimiting URLs.
	    // We actually just auto-escape these.
	    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	    // RFC 2396: characters not allowed for various reasons.
	    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	    autoEscape = ['\''].concat(unwise),
	    // Characters that are never ever allowed in a hostname.
	    // Note that any invalid chars are also handled, but these
	    // are the ones that are *expected* to be seen, so we fast-path
	    // them.
	    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	    hostEndingChars = ['/', '?', '#'],
	    hostnameMaxLen = 255,
	    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
	    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
	    // protocols that can allow "unsafe" and "unwise" chars.
	    unsafeProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that never have a hostname.
	    hostlessProtocol = {
	      'javascript': true,
	      'javascript:': true
	    },
	    // protocols that always contain a // bit.
	    slashedProtocol = {
	      'http': true,
	      'https': true,
	      'ftp': true,
	      'gopher': true,
	      'file': true,
	      'http:': true,
	      'https:': true,
	      'ftp:': true,
	      'gopher:': true,
	      'file:': true
	    },
	    querystring = __webpack_require__(4);

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && isObject(url) && url instanceof Url) return url;

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}

	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  if (!isString(url)) {
	    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
	  }

	  var rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    this.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      this.slashes = true;
	    }
	  }

	  if (!hostlessProtocol[proto] &&
	      (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (var i = 0; i < hostEndingChars.length; i++) {
	      var hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      this.auth = decodeURIComponent(auth);
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (var i = 0; i < nonHostChars.length; i++) {
	      var hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;

	    this.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    this.parseHost();

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    this.hostname = this.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = this.hostname[0] === '[' &&
	        this.hostname[this.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = this.hostname.split(/\./);
	      for (var i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            this.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (this.hostname.length > hostnameMaxLen) {
	      this.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      this.hostname = this.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a puny coded representation of "domain".
	      // It only converts the part of the domain name that
	      // has non ASCII characters. I.e. it dosent matter if
	      // you call it with a domain that already is in ASCII.
	      var domainArray = this.hostname.split('.');
	      var newOut = [];
	      for (var i = 0; i < domainArray.length; ++i) {
	        var s = domainArray[i];
	        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
	            'xn--' + punycode.encode(s) : s);
	      }
	      this.hostname = newOut.join('.');
	    }

	    var p = this.port ? ':' + this.port : '';
	    var h = this.hostname || '';
	    this.host = h + p;
	    this.href += this.host;

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {

	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (var i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    this.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    this.search = rest.substr(qm);
	    this.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      this.query = querystring.parse(this.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    this.search = '';
	    this.query = {};
	  }
	  if (rest) this.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	      this.hostname && !this.pathname) {
	    this.pathname = '/';
	  }

	  //to support http.request
	  if (this.pathname || this.search) {
	    var p = this.pathname || '';
	    var s = this.search || '';
	    this.path = p + s;
	  }

	  // finally, reconstruct the href based on what has been validated.
	  this.href = this.format();
	  return this;
	};

	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (isString(obj)) obj = urlParse(obj);
	  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
	  return obj.format();
	}

	Url.prototype.format = function() {
	  var auth = this.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = this.protocol || '',
	      pathname = this.pathname || '',
	      hash = this.hash || '',
	      host = false,
	      query = '';

	  if (this.host) {
	    host = auth + this.host;
	  } else if (this.hostname) {
	    host = auth + (this.hostname.indexOf(':') === -1 ?
	        this.hostname :
	        '[' + this.hostname + ']');
	    if (this.port) {
	      host += ':' + this.port;
	    }
	  }

	  if (this.query &&
	      isObject(this.query) &&
	      Object.keys(this.query).length) {
	    query = querystring.stringify(this.query);
	  }

	  var search = this.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (this.slashes ||
	      (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  Object.keys(this).forEach(function(k) {
	    result[k] = this[k];
	  }, this);

	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;

	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    Object.keys(relative).forEach(function(k) {
	      if (k !== 'protocol')
	        result[k] = relative[k];
	    });

	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	        result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }

	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      Object.keys(relative).forEach(function(k) {
	        result[k] = relative[k];
	      });
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      var relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	      isRelAbs = (
	          relative.host ||
	          relative.pathname && relative.pathname.charAt(0) === '/'
	      ),
	      mustEndAbs = (isRelAbs || isSourceAbs ||
	                    (result.host && relative.pathname)),
	      removeAllDots = mustEndAbs,
	      srcPath = result.pathname && result.pathname.split('/') || [],
	      relPath = relative.pathname && relative.pathname.split('/') || [],
	      psychotic = result.protocol && !slashedProtocol[result.protocol];

	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }

	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	                  relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	                      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especialy happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                       result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!isNull(result.pathname) || !isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	                    (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	      (result.host || relative.host) && (last === '.' || last === '..') ||
	      last === '');

	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last == '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	      (srcPath[0] && srcPath[0].charAt(0) === '/');

	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	                                    srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especialy happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    var authInHost = result.host && result.host.indexOf('@') > 0 ?
	                     result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  //to support request.http
	  if (!isNull(result.pathname) || !isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	                  (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  var host = this.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      this.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) this.hostname = host;
	};

	function isString(arg) {
	  return typeof arg === "string";
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isNull(arg) {
	  return arg === null;
	}
	function isNullOrUndefined(arg) {
	  return  arg == null;
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module, global) {/*! https://mths.be/punycode v1.3.2 by @mathias */
	;(function(root) {

		/** Detect free variables */
		var freeExports = typeof exports == 'object' && exports &&
			!exports.nodeType && exports;
		var freeModule = typeof module == 'object' && module &&
			!module.nodeType && module;
		var freeGlobal = typeof global == 'object' && global;
		if (
			freeGlobal.global === freeGlobal ||
			freeGlobal.window === freeGlobal ||
			freeGlobal.self === freeGlobal
		) {
			root = freeGlobal;
		}

		/**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
		var punycode,

		/** Highest positive signed 32-bit float value */
		maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

		/** Bootstring parameters */
		base = 36,
		tMin = 1,
		tMax = 26,
		skew = 38,
		damp = 700,
		initialBias = 72,
		initialN = 128, // 0x80
		delimiter = '-', // '\x2D'

		/** Regular expressions */
		regexPunycode = /^xn--/,
		regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
		regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

		/** Error messages */
		errors = {
			'overflow': 'Overflow: input needs wider integers to process',
			'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
			'invalid-input': 'Invalid input'
		},

		/** Convenience shortcuts */
		baseMinusTMin = base - tMin,
		floor = Math.floor,
		stringFromCharCode = String.fromCharCode,

		/** Temporary variable */
		key;

		/*--------------------------------------------------------------------------*/

		/**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
		function error(type) {
			throw RangeError(errors[type]);
		}

		/**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
		function map(array, fn) {
			var length = array.length;
			var result = [];
			while (length--) {
				result[length] = fn(array[length]);
			}
			return result;
		}

		/**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
		function mapDomain(string, fn) {
			var parts = string.split('@');
			var result = '';
			if (parts.length > 1) {
				// In email addresses, only the domain name should be punycoded. Leave
				// the local part (i.e. everything up to `@`) intact.
				result = parts[0] + '@';
				string = parts[1];
			}
			// Avoid `split(regex)` for IE8 compatibility. See #17.
			string = string.replace(regexSeparators, '\x2E');
			var labels = string.split('.');
			var encoded = map(labels, fn).join('.');
			return result + encoded;
		}

		/**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
		function ucs2decode(string) {
			var output = [],
			    counter = 0,
			    length = string.length,
			    value,
			    extra;
			while (counter < length) {
				value = string.charCodeAt(counter++);
				if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
					// high surrogate, and there is a next character
					extra = string.charCodeAt(counter++);
					if ((extra & 0xFC00) == 0xDC00) { // low surrogate
						output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
					} else {
						// unmatched surrogate; only append this code unit, in case the next
						// code unit is the high surrogate of a surrogate pair
						output.push(value);
						counter--;
					}
				} else {
					output.push(value);
				}
			}
			return output;
		}

		/**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
		function ucs2encode(array) {
			return map(array, function(value) {
				var output = '';
				if (value > 0xFFFF) {
					value -= 0x10000;
					output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
					value = 0xDC00 | value & 0x3FF;
				}
				output += stringFromCharCode(value);
				return output;
			}).join('');
		}

		/**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
		function basicToDigit(codePoint) {
			if (codePoint - 48 < 10) {
				return codePoint - 22;
			}
			if (codePoint - 65 < 26) {
				return codePoint - 65;
			}
			if (codePoint - 97 < 26) {
				return codePoint - 97;
			}
			return base;
		}

		/**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
		function digitToBasic(digit, flag) {
			//  0..25 map to ASCII a..z or A..Z
			// 26..35 map to ASCII 0..9
			return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
		}

		/**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
		function adapt(delta, numPoints, firstTime) {
			var k = 0;
			delta = firstTime ? floor(delta / damp) : delta >> 1;
			delta += floor(delta / numPoints);
			for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
				delta = floor(delta / baseMinusTMin);
			}
			return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
		}

		/**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
		function decode(input) {
			// Don't use UCS-2
			var output = [],
			    inputLength = input.length,
			    out,
			    i = 0,
			    n = initialN,
			    bias = initialBias,
			    basic,
			    j,
			    index,
			    oldi,
			    w,
			    k,
			    digit,
			    t,
			    /** Cached calculation results */
			    baseMinusT;

			// Handle the basic code points: let `basic` be the number of input code
			// points before the last delimiter, or `0` if there is none, then copy
			// the first basic code points to the output.

			basic = input.lastIndexOf(delimiter);
			if (basic < 0) {
				basic = 0;
			}

			for (j = 0; j < basic; ++j) {
				// if it's not a basic code point
				if (input.charCodeAt(j) >= 0x80) {
					error('not-basic');
				}
				output.push(input.charCodeAt(j));
			}

			// Main decoding loop: start just after the last delimiter if any basic code
			// points were copied; start at the beginning otherwise.

			for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

				// `index` is the index of the next character to be consumed.
				// Decode a generalized variable-length integer into `delta`,
				// which gets added to `i`. The overflow checking is easier
				// if we increase `i` as we go, then subtract off its starting
				// value at the end to obtain `delta`.
				for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

					if (index >= inputLength) {
						error('invalid-input');
					}

					digit = basicToDigit(input.charCodeAt(index++));

					if (digit >= base || digit > floor((maxInt - i) / w)) {
						error('overflow');
					}

					i += digit * w;
					t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

					if (digit < t) {
						break;
					}

					baseMinusT = base - t;
					if (w > floor(maxInt / baseMinusT)) {
						error('overflow');
					}

					w *= baseMinusT;

				}

				out = output.length + 1;
				bias = adapt(i - oldi, out, oldi == 0);

				// `i` was supposed to wrap around from `out` to `0`,
				// incrementing `n` each time, so we'll fix that now:
				if (floor(i / out) > maxInt - n) {
					error('overflow');
				}

				n += floor(i / out);
				i %= out;

				// Insert `n` at position `i` of the output
				output.splice(i++, 0, n);

			}

			return ucs2encode(output);
		}

		/**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
		function encode(input) {
			var n,
			    delta,
			    handledCPCount,
			    basicLength,
			    bias,
			    j,
			    m,
			    q,
			    k,
			    t,
			    currentValue,
			    output = [],
			    /** `inputLength` will hold the number of code points in `input`. */
			    inputLength,
			    /** Cached calculation results */
			    handledCPCountPlusOne,
			    baseMinusT,
			    qMinusT;

			// Convert the input in UCS-2 to Unicode
			input = ucs2decode(input);

			// Cache the length
			inputLength = input.length;

			// Initialize the state
			n = initialN;
			delta = 0;
			bias = initialBias;

			// Handle the basic code points
			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue < 0x80) {
					output.push(stringFromCharCode(currentValue));
				}
			}

			handledCPCount = basicLength = output.length;

			// `handledCPCount` is the number of code points that have been handled;
			// `basicLength` is the number of basic code points.

			// Finish the basic string - if it is not empty - with a delimiter
			if (basicLength) {
				output.push(delimiter);
			}

			// Main encoding loop:
			while (handledCPCount < inputLength) {

				// All non-basic code points < n have been handled already. Find the next
				// larger one:
				for (m = maxInt, j = 0; j < inputLength; ++j) {
					currentValue = input[j];
					if (currentValue >= n && currentValue < m) {
						m = currentValue;
					}
				}

				// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
				// but guard against overflow
				handledCPCountPlusOne = handledCPCount + 1;
				if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
					error('overflow');
				}

				delta += (m - n) * handledCPCountPlusOne;
				n = m;

				for (j = 0; j < inputLength; ++j) {
					currentValue = input[j];

					if (currentValue < n && ++delta > maxInt) {
						error('overflow');
					}

					if (currentValue == n) {
						// Represent delta as a generalized variable-length integer
						for (q = delta, k = base; /* no condition */; k += base) {
							t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
							if (q < t) {
								break;
							}
							qMinusT = q - t;
							baseMinusT = base - t;
							output.push(
								stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
							);
							q = floor(qMinusT / baseMinusT);
						}

						output.push(stringFromCharCode(digitToBasic(q, 0)));
						bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
						delta = 0;
						++handledCPCount;
					}
				}

				++delta;
				++n;

			}
			return output.join('');
		}

		/**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
		function toUnicode(input) {
			return mapDomain(input, function(string) {
				return regexPunycode.test(string)
					? decode(string.slice(4).toLowerCase())
					: string;
			});
		}

		/**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
		function toASCII(input) {
			return mapDomain(input, function(string) {
				return regexNonASCII.test(string)
					? 'xn--' + encode(string)
					: string;
			});
		}

		/*--------------------------------------------------------------------------*/

		/** Define the public API */
		punycode = {
			/**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
			'version': '1.3.2',
			/**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
			'ucs2': {
				'decode': ucs2decode,
				'encode': ucs2encode
			},
			'decode': decode,
			'encode': encode,
			'toASCII': toASCII,
			'toUnicode': toUnicode
		};

		/** Expose `punycode` */
		// Some AMD build optimizers, like r.js, check for specific condition patterns
		// like the following:
		if (
			true
		) {
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
				return punycode;
			}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		} else if (freeExports && freeModule) {
			if (module.exports == freeExports) { // in Node.js or RingoJS v0.8.0+
				freeModule.exports = punycode;
			} else { // in Narwhal or RingoJS v0.7.0-
				for (key in punycode) {
					punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
				}
			}
		} else { // in Rhino or a web browser
			root.punycode = punycode;
		}

	}(this));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)(module), (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.decode = exports.parse = __webpack_require__(5);
	exports.encode = exports.stringify = __webpack_require__(6);


/***/ },
/* 5 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	module.exports = function(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty(obj, k)) {
	      obj[k] = v;
	    } else if (Array.isArray(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	'use strict';

	var stringifyPrimitive = function(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	};

	module.exports = function(obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return Object.keys(obj).map(function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (Array.isArray(obj[k])) {
	        return obj[k].map(function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var pew = __webpack_require__(8);
	var wire = __webpack_require__(13);
	var RestApiClient = __webpack_require__(14);

	var SimpleEventEmitter = exports.SimpleEventEmitter = function () {
	    function SimpleEventEmitter() {
	        _classCallCheck(this, SimpleEventEmitter);

	        this._listeners = {};
	    }

	    _createClass(SimpleEventEmitter, [{
	        key: "on",
	        value: function on(event, listener) {
	            var listeners = this._listeners[event];
	            if (!listeners) {
	                this._listeners[event] = listeners = [];
	            }
	            listeners.push(listener);
	        }
	    }, {
	        key: "emit",
	        value: function emit(event, arg1, arg2, arg3) {
	            var listeners = this._listeners[event];
	            if (!listeners) {
	                return;
	            }
	            listeners.forEach(function (listener) {
	                listener(arg1, arg2, arg3);
	            });
	        }
	    }]);

	    return SimpleEventEmitter;
	}();

	var LoginResult = exports.LoginResult = function LoginResult() {
	    _classCallCheck(this, LoginResult);
	};

	var ConnectionError = exports.ConnectionError = function () {
	    function ConnectionError(msg) {
	        _classCallCheck(this, ConnectionError);

	        this.message = msg;
	    }

	    _createClass(ConnectionError, [{
	        key: "toString",
	        value: function toString() {
	            return this.message;
	        }
	    }]);

	    return ConnectionError;
	}();

	var CreateDeviceError = exports.CreateDeviceError = function () {
	    function CreateDeviceError(msg) {
	        _classCallCheck(this, CreateDeviceError);

	        this.message = msg;
	    }

	    _createClass(CreateDeviceError, [{
	        key: "toString",
	        value: function toString() {
	            return this.message;
	        }
	    }]);

	    return CreateDeviceError;
	}();

	var CreateDeviceInfo = exports.CreateDeviceInfo = function CreateDeviceInfo(id, secret, tags) {
	    _classCallCheck(this, CreateDeviceInfo);

	    this.id = id;
	    this.secret = secret;
	    this.tags = tags;
	};

	var CreateUserError = exports.CreateUserError = function () {
	    function CreateUserError(msg) {
	        _classCallCheck(this, CreateUserError);

	        this.message = msg;
	    }

	    _createClass(CreateUserError, [{
	        key: "toString",
	        value: function toString() {
	            return this.message;
	        }
	    }]);

	    return CreateUserError;
	}();

	var ResetPasswordError = exports.ResetPasswordError = function () {
	    function ResetPasswordError(msg) {
	        _classCallCheck(this, ResetPasswordError);

	        this.message = msg;
	    }

	    _createClass(ResetPasswordError, [{
	        key: "toString",
	        value: function toString() {
	            return this.message;
	        }
	    }]);

	    return ResetPasswordError;
	}();

	var ConnectionResult = exports.ConnectionResult = function ConnectionResult() {
	    _classCallCheck(this, ConnectionResult);
	};

	var ResponseWrapper = function ResponseWrapper() {
	    _classCallCheck(this, ResponseWrapper);
	};

	var ChannelError = exports.ChannelError = function () {
	    function ChannelError(msg) {
	        _classCallCheck(this, ChannelError);

	        this.message = msg;
	    }

	    _createClass(ChannelError, [{
	        key: "toString",
	        value: function toString() {
	            return this.message;
	        }
	    }]);

	    return ChannelError;
	}();

	var ChannelMessage = exports.ChannelMessage = function ChannelMessage() {
	    _classCallCheck(this, ChannelMessage);
	};
	/**
	 * Channel
	 *
	 * @fires message When a message is received on the channel.
	 * @fires join When someone joins the channel.
	 * @fires leave When someone has left the channel.
	 */


	var Channel = exports.Channel = function (_SimpleEventEmitter) {
	    _inherits(Channel, _SimpleEventEmitter);

	    function Channel(client, name) {
	        _classCallCheck(this, Channel);

	        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Channel).call(this));

	        _this.unsubscribeCallback = null;
	        _this.client = client;
	        _this.name = name;
	        _this.responses = {};
	        _this.keySpaces = {};
	        _this.channelPermissions = [];
	        _this.currentSubscribers = [];
	        _this.keySpaces["_meta"] = new ChannelData(client, "_meta", _this);
	        _this.keySpaces["def"] = new ChannelData(client, "def", _this);
	        _this.metaKeyspace().on("subs", function (doc) {
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
	        return _this;
	    }

	    /**
	     * Get the name of this Channel.
	     * @returns {string}
	     */


	    _createClass(Channel, [{
	        key: "getName",
	        value: function getName() {
	            return this.name;
	        }

	        /**
	         * Get either the named ChannelData or the default if no namespace is
	         * specified.
	         * @param namespace
	         * @returns {ChannelData}
	         */

	    }, {
	        key: "getChannelData",
	        value: function getChannelData(namespace) {
	            namespace = namespace || 'def';
	            return this.getOrCreateChannelData(namespace);
	        }

	        /**
	         * Get the clientIds of the current subscribers on this channel.
	         * @returns {Array<string>}
	         */

	    }, {
	        key: "getSubscribers",
	        value: function getSubscribers() {
	            var subs = [];
	            var doc = this.metaKeyspace().get("subs");
	            if (doc) {
	                var subsAry = doc.subs;
	                subsAry.forEach(function (id) {
	                    subs.push(id);
	                });
	            }
	            return subs;
	        }

	        /**
	         * Get the names of the current channel data namespaces associated with the channel.
	         * @returns {Array<string>}
	         */

	    }, {
	        key: "getNamespaces",
	        value: function getNamespaces() {
	            var names = [];
	            Object.keys(this.keySpaces).forEach(function (key) {
	                if (key !== '_meta') {
	                    names.push(key);
	                }
	            });
	            return names;
	        }

	        /**
	         * Send a message to the channel. Payload can be any JSON object.
	         * @param payload
	         * @param callback
	         */

	    }, {
	        key: "publish",
	        value: function publish(payload, callback) {
	            // this is how you send stuff to channel
	            // probably needs options
	            // "for now" it has to be a JSON object
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
	        }

	        /**
	         * Unsubscribe from the specified channel.
	         * @param channel
	         */

	    }, {
	        key: "unsubscribe",
	        value: function unsubscribe(callback) {
	            var msg = new wire.WireChannelUnSubscribe();
	            msg.name = this.getName();
	            this.client.sendToServer(msg);
	            this.unsubscribeCallback = callback;
	        }

	        ////////////////////////////////////////////////////////////////////////////
	        // End of public interface
	        ////////////////////////////////////////////////////////////////////////////

	    }, {
	        key: "onWireChannelMessage",
	        value: function onWireChannelMessage(msg) {
	            var channelMessage = new ChannelMessage();
	            channelMessage.channel = this;
	            channelMessage.payload = msg.payload;
	            channelMessage.senderId = msg.senderId;
	            this.emit('message', channelMessage);
	        }
	    }, {
	        key: "onWireQueueMessage",
	        value: function onWireQueueMessage(msg) {
	            if (msg.id) {
	                var wrapper = this.responses[msg.id];
	                if (wrapper) {
	                    delete this.responses[msg.id];
	                    if (wrapper.type == "json") {
	                        wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));
	                    } else if (wrapper.type == "bytes") {} else if (wrapper.type == "string") {} else {
	                        console.error("Failed wire queue message.");
	                    }
	                }
	            } else {
	                console.error("Error mapping response id " + msg.id);
	            }
	        }
	    }, {
	        key: "onWireChannelDataCreate",
	        value: function onWireChannelDataCreate(msg) {
	            this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
	        }
	    }, {
	        key: "onWireChannelDataUpdate",
	        value: function onWireChannelDataUpdate(msg) {
	            this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
	        }
	    }, {
	        key: "onWireChannelDataDelete",
	        value: function onWireChannelDataDelete(msg) {
	            var channelData = this.getOrCreateChannelData(msg.ks);
	            channelData.onWireChannelDataDelete(msg);
	        }
	    }, {
	        key: "onWireChannelLeave",
	        value: function onWireChannelLeave(msg) {
	            if (this.unsubscribeCallback) {
	                this.unsubscribeCallback();
	            }
	        }
	    }, {
	        key: "setChannelPermissions",
	        value: function setChannelPermissions(perms) {
	            this.channelPermissions = perms;
	        }
	    }, {
	        key: "hasPermission",
	        value: function hasPermission(p) {
	            var ret = false;
	            this.channelPermissions.forEach(function (perm) {
	                if (p == perm) {
	                    ret = true;
	                }
	            });
	            return ret;
	        }
	    }, {
	        key: "diff",
	        value: function diff(a1, a2) {
	            var a = [],
	                diff = [];
	            for (var i = 0; i < a1.length; i++) {
	                a[a1[i]] = true;
	            }for (var i = 0; i < a2.length; i++) {
	                if (a[a2[i]]) delete a[a2[i]];else a[a2[i]] = true;
	            }for (var k in a) {
	                diff.push(k);
	            }return diff;
	        }
	    }, {
	        key: "listChanged",
	        value: function listChanged(orig, current) {
	            var result = [];
	            orig.forEach(function (key) {
	                if (-1 === current.indexOf(key)) {
	                    result.push(key);
	                }
	            }, this);
	            return result;
	        }
	    }, {
	        key: "metaKeyspace",
	        value: function metaKeyspace() {
	            return this.keySpaces["_meta"];
	        }
	    }, {
	        key: "publishByteArray",
	        value: function publishByteArray(payload) {
	            var msg = new wire.WireChannelMessage();
	            msg.name = this.name;
	            msg.payload = payload;
	            this.client.sendToServer(msg);
	        }
	    }, {
	        key: "getOrCreateChannelData",
	        value: function getOrCreateChannelData(ks) {
	            var cd;
	            //backstop for default keyspace
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
	        }
	    }]);

	    return Channel;
	}(SimpleEventEmitter);
	/**
	 * ChannelData
	 *
	 * @fires add(key, value) When a new key/value is added.
	 * @fires update(key, value) When a key's value is updated.
	 * @fires remove(key) When a key and it's value is removed.
	 * @fires 'key'(value, operation) When the specified key is added, updated or
	 * removed this event will be fired. Operation will be one of add, update, or
	 * remove.
	 */


	var ChannelData = exports.ChannelData = function (_SimpleEventEmitter2) {
	    _inherits(ChannelData, _SimpleEventEmitter2);

	    function ChannelData(client, keySpace, channel) {
	        _classCallCheck(this, ChannelData);

	        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(ChannelData).call(this));

	        _this2.client = client;
	        _this2.keySpace = keySpace;
	        _this2.elementMap = {};
	        _this2.channel = channel;
	        _this2.onWireChannelDataCreate.bind(_this2);
	        _this2.onWireChannelDataDelete.bind(_this2);
	        _this2.onWireChannelDataUpdate.bind(_this2);
	        return _this2;
	    }

	    /**
	     * Get the value for the specified key.
	     * @param key
	     * @returns {any}
	     */


	    _createClass(ChannelData, [{
	        key: "get",
	        value: function get(key) {
	            return this.elementMap[key];
	        }

	        /**
	         * Set a value for the specified key.
	         * @param key
	         * @param value
	         * @param callback
	         */

	    }, {
	        key: "put",
	        value: function put(key, value, callback) {
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
	        }

	        /**
	         * Remove the specified key and it's value.
	         * @param key
	         * @param callback
	         */

	    }, {
	        key: "remove",
	        value: function remove(key, callback) {
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
	        }

	        /**
	         * Get a list of the keys on this ChannelData.
	         * @returns {Array}
	         */

	    }, {
	        key: "getKeys",
	        value: function getKeys() {
	            var keys = [];
	            for (var k in this.elementMap) {
	                keys.push(k);
	            }
	            return keys;
	        }

	        ////////////////////////////////////////////////////////////////////////////
	        // End of public interface
	        ////////////////////////////////////////////////////////////////////////////

	    }, {
	        key: "onWireChannelDataCreate",
	        value: function onWireChannelDataCreate(msg) {
	            var payload = msg.payload.getBytesAsUTF8();
	            var o = JSON.parse(payload);
	            this.elementMap[msg.key] = o;
	            this.emit('add', msg.key, o);
	            this.emit(msg.key, o, 'add');
	        }
	    }, {
	        key: "onWireChannelDataUpdate",
	        value: function onWireChannelDataUpdate(msg) {
	            var payload = msg.payload.getBytesAsUTF8();
	            var o = JSON.parse(payload);
	            this.elementMap[msg.key] = o;
	            this.emit('update', msg.key, o);
	            this.emit(msg.key, o, 'update');
	        }
	    }, {
	        key: "onWireChannelDataDelete",
	        value: function onWireChannelDataDelete(msg) {
	            delete this.elementMap[msg.key];
	            this.emit('remove', msg.key);
	            this.emit(msg.key, null, 'remove');
	        }
	    }]);

	    return ChannelData;
	}(SimpleEventEmitter);

	var AbstractBigBangClient = exports.AbstractBigBangClient = function (_SimpleEventEmitter3) {
	    _inherits(AbstractBigBangClient, _SimpleEventEmitter3);

	    function AbstractBigBangClient(appUrl) {
	        _classCallCheck(this, AbstractBigBangClient);

	        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(AbstractBigBangClient).call(this));

	        _this3.bufString = "";
	        _this3._appUrl = appUrl;
	        _this3.wireProtocol = new wire.WireProtocol();
	        _this3.wireProtocol.listener = _this3;
	        _this3.connect = _this3.connect.bind(_this3);
	        _this3.onConnect = _this3.onConnect.bind(_this3);
	        _this3.subscribe = _this3.subscribe.bind(_this3);
	        _this3.channelSubscribeMap = {};
	        _this3.channelMap = {};
	        return _this3;
	    }

	    _createClass(AbstractBigBangClient, [{
	        key: "_getRestClient",
	        value: function _getRestClient() {
	            var api = new RestApiClient.DefaultApi();
	            api.apiClient.basePath = this._appUrl + '/api/v1';
	            return api;
	        }
	    }, {
	        key: "connect",
	        value: function connect(url, options, callback) {
	            throw new Error("abstract");
	        }
	    }, {
	        key: "connectAsDevice",
	        value: function connectAsDevice(id, secret, callback) {
	            throw new Error('abstract');
	        }
	    }, {
	        key: "createUser",
	        value: function createUser(email, password, callback) {
	            var api = this._getRestClient();
	            var body = new RestApiClient.CreateUserRequest();
	            body.email = email;
	            body.password = password;

	            api.createUser(body, function (err, data, response) {
	                if (err) {
	                    callback(new CreateUserError("Invalid response.  Check your server URL and try again."));
	                    return;
	                } else {
	                    var json = response.body;
	                    if (json.created) {
	                        callback(null);
	                        return;
	                    } else {
	                        callback(new CreateUserError(json.userMessage));
	                        return;
	                    }
	                }
	            });
	        }
	    }, {
	        key: "authUser",
	        value: function authUser(user, password, callback) {
	            var api = this._getRestClient();
	            var body = new RestApiClient.AuthUserRequest();
	            body.email = user;
	            body.password = password;

	            api.authUser(body, function (err, data, response) {
	                if (err) {
	                    console.error(err);
	                    callback(new ConnectionError('Unable to authenticate user.'), null);
	                    return;
	                } else {
	                    var json = response.body;
	                    var loginResult = new LoginResult();
	                    try {
	                        loginResult.authenticated = json.authenticated;
	                        loginResult.clientKey = json.clientKey;
	                        loginResult.message = json.message;
	                        callback(loginResult);
	                        return;
	                    } catch (e) {
	                        loginResult.authenticated = false;
	                        loginResult.message = e.message;
	                        callback(loginResult);
	                        return;
	                    }
	                }
	            });
	        }
	    }, {
	        key: "authAnon",
	        value: function authAnon(callback) {
	            var api = this._getRestClient();

	            api.authAnon(function (err, data, response) {
	                if (err) {
	                    console.error(err);
	                    callback(new ConnectionError('Unable to authenticate user.'), null);
	                    return;
	                } else {
	                    var json = response.body;
	                    var loginResult = new LoginResult();
	                    try {
	                        loginResult.authenticated = json.authenticated;
	                        loginResult.clientKey = json.clientKey;
	                        loginResult.message = json.message;
	                        callback(loginResult);
	                        return;
	                    } catch (e) {
	                        loginResult.authenticated = false;
	                        loginResult.message = e.message;
	                        callback(loginResult);
	                        return;
	                    }
	                }
	            });
	        }
	    }, {
	        key: "resetPassword",
	        value: function resetPassword(email, callback) {
	            var api = this._getRestClient();
	            api.resetPassword(email, function (err, data, response) {
	                if (err) {
	                    console.error(err);
	                    callback(new ResetPasswordError("Invalid response.  Check your server URL and try again."));
	                    return;
	                } else {
	                    var json = response.body;
	                    if (json.reset) {
	                        callback(null);
	                    } else {
	                        callback(new ResetPasswordError(json.message));
	                    }
	                }
	            });
	        }
	    }, {
	        key: "createDevice",
	        value: function createDevice(tags, callback) {
	            var api = this._getRestClient();
	            var body = new RestApiClient.CreateDeviceRequest();
	            body.tags = tags;

	            api.create(body, function (err, data, response) {
	                if (err) {
	                    console.error(err);
	                    callback(new CreateDeviceError("Invalid response.  Check your server URL and try again."), null);
	                    return;
	                } else {
	                    var json = response.body;
	                    callback(null, new CreateDeviceInfo(json.id, json.secret, json.tags));
	                    return;
	                }
	            });
	        }
	    }, {
	        key: "authenticateDevice",
	        value: function authenticateDevice(id, secret, callback) {
	            var api = this._getRestClient();
	            var body = new RestApiClient.AuthDeviceRequest();
	            body.id = id;
	            body.secret = secret;

	            api.authDevice(body, function (err, data, response) {
	                if (err) {
	                    console.error(err);
	                    callback(new ConnectionError('Unable to authenticate device.'), null);
	                    return;
	                } else {
	                    var json = response.body;
	                    callback(null, json);
	                    return;
	                }
	            });
	        }
	    }, {
	        key: "disconnect",
	        value: function disconnect() {
	            this.sendToServer(new wire.WireDisconnectRequest());
	        }
	    }, {
	        key: "subscribe",
	        value: function subscribe(channel, options, callback) {
	            if (options instanceof Function) {
	                callback = options;
	                options = null;
	            }
	            this.channelSubscribeMap[channel] = callback;
	            var msg = new wire.WireChannelSubscribe();
	            msg.name = channel;
	            this.sendToServer(msg);
	        }
	    }, {
	        key: "getClientId",
	        value: function getClientId() {
	            return this._clientId;
	        }
	    }, {
	        key: "getChannel",
	        value: function getChannel(channel) {
	            return this.channelMap[channel];
	        }
	    }, {
	        key: "getDeviceChannel",
	        value: function getDeviceChannel(callback) {
	            var c = this.getChannel(this._deviceId);
	            if (c) {
	                callback(c);
	                return;
	            } else {
	                this.subscribe(this._deviceId, function (err, channel) {
	                    callback(channel);
	                    return;
	                });
	            }
	        }

	        ////////////////////////////////////////////////////////////////////////////
	        // End of public interface
	        ////////////////////////////////////////////////////////////////////////////

	    }, {
	        key: "sendToServer",
	        value: function sendToServer(msg) {
	            throw new Error("Unimplemented: sendToServer");
	        }
	    }, {
	        key: "onConnect",
	        value: function onConnect() {
	            var req = new wire.WireConnectRequest();
	            req.clientKey = this._clientKey;
	            req.version = 1234;
	            this.sendToServer(req);
	        }
	    }, {
	        key: "publish",
	        value: function publish(channel, payload) {
	            var msg = new wire.WireChannelMessage();
	            msg.name = channel;
	            msg.payload = new pew.ByteArray(pew.base64_encode(payload));
	            this.sendToServer(msg);
	        }
	    }, {
	        key: "onReceiveText",
	        value: function onReceiveText(data) {
	            //tack it on, yo
	            this.bufString += data;
	            while (this.parseTextStream()) {}
	        }
	    }, {
	        key: "parseTextStream",
	        value: function parseTextStream() {
	            var delimIdx = this.bufString.indexOf(":");
	            if (delimIdx != -1) {
	                var lenStr = this.bufString.substr(0, delimIdx);
	                var msgLen = parseInt(lenStr);
	                //Save the earth, recycle.
	                if (this.bufString.length < msgLen + 1 + delimIdx) {
	                    //just give up, leave the bufString alone for now..
	                    return false;
	                } else {
	                    var body = this.bufString.substr(delimIdx + 1, msgLen + 1);
	                    var c = body.charAt(body.length - 1);
	                    if (c != ',') {
	                        // TODO: need to explode and kill the client or something here..
	                        console.error("TextProtocol decode exception, not terminated with comma");
	                    }
	                    var actualBody = body.substr(0, body.length - 1);
	                    //we actually have a message! Wheeee!
	                    this.wireProtocol.dispatchNetstring(actualBody);
	                    //pack up the leftovers.
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
	        }
	    }, {
	        key: "onWireChannelJoin",
	        value: function onWireChannelJoin(msg) {
	            var callback = this.channelSubscribeMap[msg.name];
	            var channel = this.channelMap[msg.name];
	            if (!channel) {
	                channel = new Channel(this, msg.name);
	            }
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
	        }
	    }, {
	        key: "onWireChannelLeave",
	        value: function onWireChannelLeave(msg) {
	            var channel = this.channelMap[msg.name];
	            channel.onWireChannelLeave(msg);
	        }
	    }, {
	        key: "onWireChannelMessage",
	        value: function onWireChannelMessage(msg) {
	            var channel = this.channelMap[msg.name];
	            channel.onWireChannelMessage(msg);
	        }
	    }, {
	        key: "onWireQueueMessage",
	        value: function onWireQueueMessage(msg) {
	            var channel = this.channelMap[msg.name];
	            channel.onWireQueueMessage(msg);
	        }
	    }, {
	        key: "onWireRpcMessage",
	        value: function onWireRpcMessage(msg) {
	            // TODO
	        }
	    }, {
	        key: "onWireConnectFailure",
	        value: function onWireConnectFailure(msg) {
	            var cr = new ConnectionResult();
	            cr.clientId = null;
	            cr.success = false;
	            cr.message = msg.failureMessage;
	            this._internalConnectionResult(cr);
	        }
	    }, {
	        key: "onWireConnectSuccess",
	        value: function onWireConnectSuccess(msg) {
	            this._clientId = msg.clientId;
	            var cr = new ConnectionResult();
	            cr.clientId = msg.clientId;
	            cr.success = true;
	            cr.message = null;
	            this._internalConnectionResult(cr);
	            //Start up clientToServerPing at specified rate
	            setInterval(function () {
	                this.sendToServer(new wire.WirePing());
	            }.bind(this), msg.clientToServerPingMS);
	        }
	    }, {
	        key: "onWireChannelDataCreate",
	        value: function onWireChannelDataCreate(msg) {
	            var channel = this.channelMap[msg.name];
	            if (!channel) {
	                throw new Error("Channel " + msg.name + " does not exist.");
	            }
	            channel.onWireChannelDataCreate(msg);
	        }
	    }, {
	        key: "onWireChannelDataUpdate",
	        value: function onWireChannelDataUpdate(msg) {
	            var channel = this.channelMap[msg.name];
	            if (!channel) {
	                throw new Error("Channel " + msg.name + " does not exist.");
	            }
	            channel.onWireChannelDataUpdate(msg);
	        }
	    }, {
	        key: "onWireChannelDataDelete",
	        value: function onWireChannelDataDelete(msg) {
	            var channel = this.channelMap[msg.name];
	            if (!channel) {
	                throw new Error("Channel " + msg.name + " does not exist.");
	            }
	            channel.onWireChannelDataDelete(msg);
	        }
	    }, {
	        key: "onWireChannelDataDel",
	        value: function onWireChannelDataDel(msg) {
	            console.log('Unimplemented: onWireChannelDataDel');
	        }
	    }, {
	        key: "onWireChannelDataPut",
	        value: function onWireChannelDataPut(msg) {
	            console.log('Unimplemented: onWireChannelDataPut');
	        }
	    }, {
	        key: "onWireDisconnectSuccess",
	        value: function onWireDisconnectSuccess(msg) {
	            this.emit('disconnected', false);
	        }
	    }, {
	        key: "onWireChannelUnSubscribe",
	        value: function onWireChannelUnSubscribe(msg) {
	            console.log("Unimplemented: onWireChannelUnSubscribe");
	        }
	    }, {
	        key: "onWireDisconnectRequest",
	        value: function onWireDisconnectRequest(msg) {
	            //not implemented on client
	        }
	    }, {
	        key: "onWireConnectRequest",
	        value: function onWireConnectRequest(msg) {
	            //not implemented on client
	        }
	    }, {
	        key: "onWireChannelSubscribe",
	        value: function onWireChannelSubscribe(msg) {
	            console.log('Unimplemented: onWireChannelSubscribe');
	        }
	    }, {
	        key: "onWirePing",
	        value: function onWirePing(msg) {
	            //Turn around and send it back.
	            this.sendToServer(new wire.WirePong());
	        }
	    }, {
	        key: "onWirePong",
	        value: function onWirePong(msg) {}
	        //Check for liveness at some point if we dont get answers.


	        /**
	         * A terrible, temporary URL parser till we can find a good one that works
	         * in Node and browser.
	         * @param url
	         */

	    }, {
	        key: "parseUrl",
	        value: function parseUrl(url) {
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
	        }
	    }]);

	    return AbstractBigBangClient;
	}(SimpleEventEmitter);
	//# sourceMappingURL=BigBangClient.js.map


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	exports.encodeNetstring = encodeNetstring;
	exports.decodeNetstring = decodeNetstring;
	exports.base64_encode = base64_encode;
	exports.base64_decode = base64_decode;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	/// <reference path="node.d.ts"/>
	/*
	 BSD LICENSE

	 Copyright (c) 2015, Big Bang IO, LLC
	 All rights reserved.

	 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

	 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	// This adds buffer object to global scope. May need additional
	// sanity testing.
	global.Buffer = Buffer;

	var ByteArray = exports.ByteArray = function () {
	    function ByteArray(payload) {
	        _classCallCheck(this, ByteArray);

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

	    _createClass(ByteArray, [{
	        key: 'getBytesAsBase64',
	        value: function getBytesAsBase64() {
	            return this.buffer.toString('utf8');
	        }
	    }, {
	        key: 'getBytesAsUTF8',
	        value: function getBytesAsUTF8() {
	            return base64_decode(this.buffer.toString('utf8'));
	        }
	    }, {
	        key: 'getBytesAsJSON',
	        value: function getBytesAsJSON() {
	            return JSON.parse(this.getBytesAsUTF8());
	        }
	    }, {
	        key: 'getBuffer',
	        value: function getBuffer() {
	            return this.buffer;
	        }
	        //Control the default JSON.stringify behavior
	        //convert into a b64 string.

	    }, {
	        key: 'toJSON',
	        value: function toJSON() {
	            return this.getBytesAsBase64();
	        }
	    }]);

	    return ByteArray;
	}();

	function encodeNetstring(s) {
	    return s.length + ":" + s + ",";
	}
	function decodeNetstring(s) {
	    var idx = s.indexOf(":");
	    var msgStr = s.substr(idx + 1);
	    return msgStr.substr(0, msgStr.length - 1);
	}
	function base64_encode(data) {
	    // http://kevin.vanzonneveld.net
	    // +   original by: Tyler Akins (http://rumkin.com)
	    // +   improved by: Bayron Guevara
	    // +   improved by: Thunder.m
	    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    // +   bugfixed by: Pellentesque Malesuada
	    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	    // +   improved by: Rafał Kukawski (http://kukawski.pl)
	    // *     example 1: base64_encode('Kevin van Zonneveld');
	    // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
	    // mozilla has this native
	    // - but breaks in 2.0.0.12!
	    //if (typeof this.window['btoa'] == 'function') {
	    //    return btoa(data);
	    //}
	    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
	    var o1,
	        o2,
	        o3,
	        h1,
	        h2,
	        h3,
	        h4,
	        bits,
	        i = 0,
	        ac = 0,
	        enc = "",
	        tmp_arr = [];
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
	        // use hexets to index into b64, and append result to encoded string
	        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
	    } while (i < data.length);
	    enc = tmp_arr.join('');
	    var r = data.length % 3;
	    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
	}
	var b64_decode_fast_hash = {};
	var b64_charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
	for (var i = 0; i < b64_charset.length; i++) {
	    b64_decode_fast_hash[b64_charset.charAt(i)] = i;
	}
	function base64_decode(data) {
	    var o1,
	        o2,
	        o3,
	        h1,
	        h2,
	        h3,
	        h4,
	        bits,
	        i = 0,
	        ac = 0,
	        dec = "",
	        tmp_arr = [];
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
	    } while (i < data.length);
	    dec = tmp_arr.join('');
	    return dec;
	}
	//# sourceMappingURL=PewRuntime.js.map

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9).Buffer, (function() { return this; }())))

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	/* eslint-disable no-proto */

	'use strict'

	var base64 = __webpack_require__(10)
	var ieee754 = __webpack_require__(11)
	var isArray = __webpack_require__(12)

	exports.Buffer = Buffer
	exports.SlowBuffer = SlowBuffer
	exports.INSPECT_MAX_BYTES = 50
	Buffer.poolSize = 8192 // not used by this implementation

	var rootParent = {}

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
	 *     on objects.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
	  ? global.TYPED_ARRAY_SUPPORT
	  : typedArraySupport()

	function typedArraySupport () {
	  function Bar () {}
	  try {
	    var arr = new Uint8Array(1)
	    arr.foo = function () { return 42 }
	    arr.constructor = Bar
	    return arr.foo() === 42 && // typed array instances can be augmented
	        arr.constructor === Bar && // constructor can be set
	        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
	        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
	  } catch (e) {
	    return false
	  }
	}

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

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
	function Buffer (arg) {
	  if (!(this instanceof Buffer)) {
	    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
	    if (arguments.length > 1) return new Buffer(arg, arguments[1])
	    return new Buffer(arg)
	  }

	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    this.length = 0
	    this.parent = undefined
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    return fromNumber(this, arg)
	  }

	  // Slightly less common case.
	  if (typeof arg === 'string') {
	    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
	  }

	  // Unusual.
	  return fromObject(this, arg)
	}

	function fromNumber (that, length) {
	  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < length; i++) {
	      that[i] = 0
	    }
	  }
	  return that
	}

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

	  // Assumption: byteLength() return value is always < kMaxLength.
	  var length = byteLength(string, encoding) | 0
	  that = allocate(that, length)

	  that.write(string, encoding)
	  return that
	}

	function fromObject (that, object) {
	  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

	  if (isArray(object)) return fromArray(that, object)

	  if (object == null) {
	    throw new TypeError('must start with number, buffer, array or string')
	  }

	  if (typeof ArrayBuffer !== 'undefined') {
	    if (object.buffer instanceof ArrayBuffer) {
	      return fromTypedArray(that, object)
	    }
	    if (object instanceof ArrayBuffer) {
	      return fromArrayBuffer(that, object)
	    }
	  }

	  if (object.length) return fromArrayLike(that, object)

	  return fromJsonObject(that, object)
	}

	function fromBuffer (that, buffer) {
	  var length = checked(buffer.length) | 0
	  that = allocate(that, length)
	  buffer.copy(that, 0, 0, length)
	  return that
	}

	function fromArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Duplicate of fromArray() to keep fromArray() monomorphic.
	function fromTypedArray (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  // Truncating the elements is probably not what people expect from typed
	  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
	  // of the old Buffer constructor.
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	function fromArrayBuffer (that, array) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    array.byteLength
	    that = Buffer._augment(new Uint8Array(array))
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromTypedArray(that, new Uint8Array(array))
	  }
	  return that
	}

	function fromArrayLike (that, array) {
	  var length = checked(array.length) | 0
	  that = allocate(that, length)
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
	// Returns a zero-length buffer for inputs that don't conform to the spec.
	function fromJsonObject (that, object) {
	  var array
	  var length = 0

	  if (object.type === 'Buffer' && isArray(object.data)) {
	    array = object.data
	    length = checked(array.length) | 0
	  }
	  that = allocate(that, length)

	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255
	  }
	  return that
	}

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype
	  Buffer.__proto__ = Uint8Array
	} else {
	  // pre-set for values that may exist in the future
	  Buffer.prototype.length = undefined
	  Buffer.prototype.parent = undefined
	}

	function allocate (that, length) {
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = Buffer._augment(new Uint8Array(length))
	    that.__proto__ = Buffer.prototype
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that.length = length
	    that._isBuffer = true
	  }

	  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
	  if (fromPool) that.parent = rootParent

	  return that
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}

	function SlowBuffer (subject, encoding) {
	  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

	  var buf = new Buffer(subject, encoding)
	  delete buf.parent
	  return buf
	}

	Buffer.isBuffer = function isBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length
	  var y = b.length

	  var i = 0
	  var len = Math.min(x, y)
	  while (i < len) {
	    if (a[i] !== b[i]) break

	    ++i
	  }

	  if (i !== len) {
	    x = a[i]
	    y = b[i]
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	}

	Buffer.isEncoding = function isEncoding (encoding) {
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

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

	  if (list.length === 0) {
	    return new Buffer(0)
	  }

	  var i
	  if (length === undefined) {
	    length = 0
	    for (i = 0; i < list.length; i++) {
	      length += list[i].length
	    }
	  }

	  var buf = new Buffer(length)
	  var pos = 0
	  for (i = 0; i < list.length; i++) {
	    var item = list[i]
	    item.copy(buf, pos)
	    pos += item.length
	  }
	  return buf
	}

	function byteLength (string, encoding) {
	  if (typeof string !== 'string') string = '' + string

	  var len = string.length
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'binary':
	      // Deprecated
	      case 'raw':
	      case 'raws':
	        return len
	      case 'utf8':
	      case 'utf-8':
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}
	Buffer.byteLength = byteLength

	function slowToString (encoding, start, end) {
	  var loweredCase = false

	  start = start | 0
	  end = end === undefined || end === Infinity ? this.length : end | 0

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
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	}

	Buffer.prototype.equals = function equals (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	}

	Buffer.prototype.inspect = function inspect () {
	  var str = ''
	  var max = exports.INSPECT_MAX_BYTES
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
	    if (this.length > max) str += ' ... '
	  }
	  return '<Buffer ' + str + '>'
	}

	Buffer.prototype.compare = function compare (b) {
	  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return 0
	  return Buffer.compare(this, b)
	}

	Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
	  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
	  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
	  byteOffset >>= 0

	  if (this.length === 0) return -1
	  if (byteOffset >= this.length) return -1

	  // Negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

	  if (typeof val === 'string') {
	    if (val.length === 0) return -1 // special case: looking for empty string always fails
	    return String.prototype.indexOf.call(this, val, byteOffset)
	  }
	  if (Buffer.isBuffer(val)) {
	    return arrayIndexOf(this, val, byteOffset)
	  }
	  if (typeof val === 'number') {
	    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
	      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
	    }
	    return arrayIndexOf(this, [ val ], byteOffset)
	  }

	  function arrayIndexOf (arr, val, byteOffset) {
	    var foundIndex = -1
	    for (var i = 0; byteOffset + i < arr.length; i++) {
	      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
	        if (foundIndex === -1) foundIndex = i
	        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
	      } else {
	        foundIndex = -1
	      }
	    }
	    return -1
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	// `get` is deprecated
	Buffer.prototype.get = function get (offset) {
	  console.log('.get() is deprecated. Access using array indexes instead.')
	  return this.readUInt8(offset)
	}

	// `set` is deprecated
	Buffer.prototype.set = function set (v, offset) {
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
	    var parsed = parseInt(string.substr(i * 2, 2), 16)
	    if (isNaN(parsed)) throw new Error('Invalid hex string')
	    buf[offset + i] = parsed
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function binaryWrite (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8'
	    length = this.length
	    offset = 0
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset
	    length = this.length
	    offset = 0
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0
	    if (isFinite(length)) {
	      length = length | 0
	      if (encoding === undefined) encoding = 'utf8'
	    } else {
	      encoding = length
	      length = undefined
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    var swap = encoding
	    encoding = offset
	    offset = length | 0
	    length = swap
	  }

	  var remaining = this.length - offset
	  if (length === undefined || length > remaining) length = remaining

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8'

	  var loweredCase = false
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'binary':
	        return binaryWrite(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase()
	        loweredCase = true
	    }
	  }
	}

	Buffer.prototype.toJSON = function toJSON () {
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
	  end = Math.min(buf.length, end)
	  var res = []

	  var i = start
	  while (i < end) {
	    var firstByte = buf[i]
	    var codePoint = null
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1]
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1]
	          thirdByte = buf[i + 2]
	          fourthByte = buf[i + 3]
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD
	      bytesPerSequence = 1
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
	      codePoint = 0xDC00 | codePoint & 0x3FF
	    }

	    res.push(codePoint)
	    i += bytesPerSequence
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = ''
	  var i = 0
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    )
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i] & 0x7F)
	  }
	  return ret
	}

	function binarySlice (buf, start, end) {
	  var ret = ''
	  end = Math.min(buf.length, end)

	  for (var i = start; i < end; i++) {
	    ret += String.fromCharCode(buf[i])
	  }
	  return ret
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

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length
	  start = ~~start
	  end = end === undefined ? len : ~~end

	  if (start < 0) {
	    start += len
	    if (start < 0) start = 0
	  } else if (start > len) {
	    start = len
	  }

	  if (end < 0) {
	    end += len
	    if (end < 0) end = 0
	  } else if (end > len) {
	    end = len
	  }

	  if (end < start) end = start

	  var newBuf
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = Buffer._augment(this.subarray(start, end))
	  } else {
	    var sliceLen = end - start
	    newBuf = new Buffer(sliceLen, undefined)
	    for (var i = 0; i < sliceLen; i++) {
	      newBuf[i] = this[i + start]
	    }
	  }

	  if (newBuf.length) newBuf.parent = this.parent || this

	  return newBuf
	}

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }

	  return val
	}

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length)
	  }

	  var val = this[offset + --byteLength]
	  var mul = 1
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul
	  }

	  return val
	}

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  return this[offset]
	}

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return this[offset] | (this[offset + 1] << 8)
	}

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  return (this[offset] << 8) | this[offset + 1]
	}

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	}

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	}

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var val = this[offset]
	  var mul = 1
	  var i = 0
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkOffset(offset, byteLength, this.length)

	  var i = byteLength
	  var mul = 1
	  var val = this[offset + --i]
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul
	  }
	  mul *= 0x80

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

	  return val
	}

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length)
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	}

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset] | (this[offset + 1] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length)
	  var val = this[offset + 1] | (this[offset] << 8)
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	}

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	}

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	}

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, true, 23, 4)
	}

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length)
	  return ieee754.read(this, offset, false, 23, 4)
	}

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, true, 52, 8)
	}

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length)
	  return ieee754.read(this, offset, false, 52, 8)
	}

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var mul = 1
	  var i = 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  byteLength = byteLength | 0
	  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

	  var i = byteLength - 1
	  var mul = 1
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 1] = (value >>> 8)
	    this[offset] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = 0
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset] = value & 0xFF
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1)

	    checkInt(this, value, offset, byteLength, limit - 1, -limit)
	  }

	  var i = byteLength - 1
	  var mul = 1
	  var sub = value < 0 ? 1 : 0
	  this[offset + i] = value & 0xFF
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
	  }

	  return offset + byteLength
	}

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
	  if (value < 0) value = 0xff + value + 1
	  this[offset] = (value & 0xff)
	  return offset + 1
	}

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	  } else {
	    objectWriteUInt16(this, value, offset, true)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8)
	    this[offset + 1] = (value & 0xff)
	  } else {
	    objectWriteUInt16(this, value, offset, false)
	  }
	  return offset + 2
	}

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff)
	    this[offset + 1] = (value >>> 8)
	    this[offset + 2] = (value >>> 16)
	    this[offset + 3] = (value >>> 24)
	  } else {
	    objectWriteUInt32(this, value, offset, true)
	  }
	  return offset + 4
	}

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value
	  offset = offset | 0
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
	  if (value < 0) value = 0xffffffff + value + 1
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24)
	    this[offset + 1] = (value >>> 16)
	    this[offset + 2] = (value >>> 8)
	    this[offset + 3] = (value & 0xff)
	  } else {
	    objectWriteUInt32(this, value, offset, false)
	  }
	  return offset + 4
	}

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (value > max || value < min) throw new RangeError('value is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('index out of range')
	  if (offset < 0) throw new RangeError('index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 23, 4)
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	}

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
	  }
	  ieee754.write(buf, value, offset, littleEndian, 52, 8)
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	}

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	}

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0
	  if (!end && end !== 0) end = this.length
	  if (targetStart >= target.length) targetStart = target.length
	  if (!targetStart) targetStart = 0
	  if (end > 0 && end < start) end = start

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start
	  }

	  var len = end - start
	  var i

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; i--) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; i++) {
	      target[i + targetStart] = this[i + start]
	    }
	  } else {
	    target._set(this.subarray(start, start + len), targetStart)
	  }

	  return len
	}

	// fill(value, start=0, end=buffer.length)
	Buffer.prototype.fill = function fill (value, start, end) {
	  if (!value) value = 0
	  if (!start) start = 0
	  if (!end) end = this.length

	  if (end < start) throw new RangeError('end < start')

	  // Fill 0 bytes; we're done
	  if (end === start) return
	  if (this.length === 0) return

	  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
	  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

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
	Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
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
	Buffer._augment = function _augment (arr) {
	  arr.constructor = Buffer
	  arr._isBuffer = true

	  // save reference to original Uint8Array set method before overwriting
	  arr._set = arr.set

	  // deprecated
	  arr.get = BP.get
	  arr.set = BP.set

	  arr.write = BP.write
	  arr.toString = BP.toString
	  arr.toLocaleString = BP.toString
	  arr.toJSON = BP.toJSON
	  arr.equals = BP.equals
	  arr.compare = BP.compare
	  arr.indexOf = BP.indexOf
	  arr.copy = BP.copy
	  arr.slice = BP.slice
	  arr.readUIntLE = BP.readUIntLE
	  arr.readUIntBE = BP.readUIntBE
	  arr.readUInt8 = BP.readUInt8
	  arr.readUInt16LE = BP.readUInt16LE
	  arr.readUInt16BE = BP.readUInt16BE
	  arr.readUInt32LE = BP.readUInt32LE
	  arr.readUInt32BE = BP.readUInt32BE
	  arr.readIntLE = BP.readIntLE
	  arr.readIntBE = BP.readIntBE
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
	  arr.writeUIntLE = BP.writeUIntLE
	  arr.writeUIntBE = BP.writeUIntBE
	  arr.writeUInt16LE = BP.writeUInt16LE
	  arr.writeUInt16BE = BP.writeUInt16BE
	  arr.writeUInt32LE = BP.writeUInt32LE
	  arr.writeUInt32BE = BP.writeUInt32BE
	  arr.writeIntLE = BP.writeIntLE
	  arr.writeIntBE = BP.writeIntBE
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

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
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

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity
	  var codePoint
	  var length = string.length
	  var leadSurrogate = null
	  var bytes = []

	  for (var i = 0; i < length; i++) {
	    codePoint = string.charCodeAt(i)

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	        leadSurrogate = codePoint
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
	    }

	    leadSurrogate = null

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint)
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      )
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF)
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo
	  var byteArray = []
	  for (var i = 0; i < str.length; i++) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i)
	    hi = c >> 8
	    lo = c % 256
	    byteArray.push(lo)
	    byteArray.push(hi)
	  }

	  return byteArray
	}

	function base64ToBytes (str) {
	  return base64.toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; i++) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i]
	  }
	  return i
	}

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9).Buffer, (function() { return this; }())))

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

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
		var PLUS_URL_SAFE = '-'.charCodeAt(0)
		var SLASH_URL_SAFE = '_'.charCodeAt(0)

		function decode (elt) {
			var code = elt.charCodeAt(0)
			if (code === PLUS ||
			    code === PLUS_URL_SAFE)
				return 62 // '+'
			if (code === SLASH ||
			    code === SLASH_URL_SAFE)
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
	}( false ? (this.base64js = {}) : exports))


/***/ },
/* 11 */
/***/ function(module, exports) {

	exports.read = function (buffer, offset, isLE, mLen, nBytes) {
	  var e, m
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var nBits = -7
	  var i = isLE ? (nBytes - 1) : 0
	  var d = isLE ? -1 : 1
	  var s = buffer[offset + i]

	  i += d

	  e = s & ((1 << (-nBits)) - 1)
	  s >>= (-nBits)
	  nBits += eLen
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1)
	  e >>= (-nBits)
	  nBits += mLen
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen)
	    e = e - eBias
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c
	  var eLen = nBytes * 8 - mLen - 1
	  var eMax = (1 << eLen) - 1
	  var eBias = eMax >> 1
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
	  var i = isLE ? 0 : (nBytes - 1)
	  var d = isLE ? 1 : -1
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

	  value = Math.abs(value)

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0
	    e = eMax
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2)
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--
	      c *= 2
	    }
	    if (e + eBias >= 1) {
	      value += rt / c
	    } else {
	      value += rt * Math.pow(2, 1 - eBias)
	    }
	    if (value * c >= 2) {
	      e++
	      c /= 2
	    }

	    if (e + eBias >= eMax) {
	      m = 0
	      e = eMax
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen)
	      e = e + eBias
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
	      e = 0
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m
	  eLen += mLen
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128
	}


/***/ },
/* 12 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.WireRpcMessage = exports.WireQueueMessage = exports.WirePong = exports.WirePing = exports.WireDisconnectSuccess = exports.WireDisconnectRequest = exports.WireConnectSuccess = exports.WireConnectRequest = exports.WireConnectFailure = exports.WireChannelUnSubscribe = exports.WireChannelSubscribe = exports.WireChannelMessage = exports.WireChannelLeave = exports.WireChannelJoin = exports.WireChannelDataUpdate = exports.WireChannelDataPut = exports.WireChannelDataDelete = exports.WireChannelDataDel = exports.WireChannelDataCreate = exports.WireProtocol = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /*
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      BSD LICENSE
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Copyright (c) 2015, Big Bang IO, LLC
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      All rights reserved.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


	var _PewRuntime = __webpack_require__(8);

	var pew = _interopRequireWildcard(_PewRuntime);

	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var WireProtocol = exports.WireProtocol = function () {
	    function WireProtocol() {
	        _classCallCheck(this, WireProtocol);

	        this.protocolId = 0;
	        this.protocolHash = 'd96a44664eff8b2a710ded18e07ab927';
	    }

	    _createClass(WireProtocol, [{
	        key: "wrapNetstring",
	        value: function wrapNetstring(msg) {
	            var msgStr = msg.messageType + ":" + msg.serializeJson();
	            return pew.encodeNetstring(msgStr);
	        }
	    }, {
	        key: "dispatchNetstring",
	        value: function dispatchNetstring(s) {
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
	        }
	    }]);

	    return WireProtocol;
	}();

	var WireChannelDataCreate = exports.WireChannelDataCreate = function () {
	    function WireChannelDataCreate() {
	        _classCallCheck(this, WireChannelDataCreate);

	        this.messageType = 0;
	    }

	    _createClass(WireChannelDataCreate, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.key = obj.key;
	            this.ks = obj.ks;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelDataCreate;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelDataCreate.key_IS_SET = 1 << 0;
	WireChannelDataCreate.ks_IS_SET = 1 << 1;
	WireChannelDataCreate.name_IS_SET = 1 << 2;
	WireChannelDataCreate.payload_IS_SET = 1 << 3;

	var WireChannelDataDel = exports.WireChannelDataDel = function () {
	    function WireChannelDataDel() {
	        _classCallCheck(this, WireChannelDataDel);

	        this.messageType = 1;
	    }

	    _createClass(WireChannelDataDel, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.key = obj.key;
	            this.ks = obj.ks;
	            this.name = obj.name;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelDataDel;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelDataDel.key_IS_SET = 1 << 0;
	WireChannelDataDel.ks_IS_SET = 1 << 1;
	WireChannelDataDel.name_IS_SET = 1 << 2;

	var WireChannelDataDelete = exports.WireChannelDataDelete = function () {
	    function WireChannelDataDelete() {
	        _classCallCheck(this, WireChannelDataDelete);

	        this.messageType = 2;
	    }

	    _createClass(WireChannelDataDelete, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.key = obj.key;
	            this.ks = obj.ks;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelDataDelete;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelDataDelete.key_IS_SET = 1 << 0;
	WireChannelDataDelete.ks_IS_SET = 1 << 1;
	WireChannelDataDelete.name_IS_SET = 1 << 2;
	WireChannelDataDelete.payload_IS_SET = 1 << 3;

	var WireChannelDataPut = exports.WireChannelDataPut = function () {
	    function WireChannelDataPut() {
	        _classCallCheck(this, WireChannelDataPut);

	        this.messageType = 3;
	    }

	    _createClass(WireChannelDataPut, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.key = obj.key;
	            this.ks = obj.ks;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelDataPut;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelDataPut.key_IS_SET = 1 << 0;
	WireChannelDataPut.ks_IS_SET = 1 << 1;
	WireChannelDataPut.name_IS_SET = 1 << 2;
	WireChannelDataPut.payload_IS_SET = 1 << 3;

	var WireChannelDataUpdate = exports.WireChannelDataUpdate = function () {
	    function WireChannelDataUpdate() {
	        _classCallCheck(this, WireChannelDataUpdate);

	        this.messageType = 4;
	    }

	    _createClass(WireChannelDataUpdate, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.key = obj.key;
	            this.ks = obj.ks;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelDataUpdate;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelDataUpdate.key_IS_SET = 1 << 0;
	WireChannelDataUpdate.ks_IS_SET = 1 << 1;
	WireChannelDataUpdate.name_IS_SET = 1 << 2;
	WireChannelDataUpdate.payload_IS_SET = 1 << 3;

	var WireChannelJoin = exports.WireChannelJoin = function () {
	    function WireChannelJoin() {
	        _classCallCheck(this, WireChannelJoin);

	        this.messageType = 5;
	    }

	    _createClass(WireChannelJoin, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.name = obj.name;
	            this.success = obj.success;
	            this.channelPermissions = obj.channelPermissions;
	            this.errorMessage = obj.errorMessage;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelJoin;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelJoin.name_IS_SET = 1 << 0;
	WireChannelJoin.success_IS_SET = 1 << 1;
	WireChannelJoin.channelPermissions_IS_SET = 1 << 2;
	WireChannelJoin.errorMessage_IS_SET = 1 << 3;

	var WireChannelLeave = exports.WireChannelLeave = function () {
	    function WireChannelLeave() {
	        _classCallCheck(this, WireChannelLeave);

	        this.messageType = 6;
	    }

	    _createClass(WireChannelLeave, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.name = obj.name;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelLeave;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelLeave.name_IS_SET = 1 << 0;

	var WireChannelMessage = exports.WireChannelMessage = function () {
	    function WireChannelMessage() {
	        _classCallCheck(this, WireChannelMessage);

	        this.messageType = 7;
	    }

	    _createClass(WireChannelMessage, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.senderId = obj.senderId;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelMessage;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelMessage.senderId_IS_SET = 1 << 0;
	WireChannelMessage.name_IS_SET = 1 << 1;
	WireChannelMessage.payload_IS_SET = 1 << 2;

	var WireChannelSubscribe = exports.WireChannelSubscribe = function () {
	    function WireChannelSubscribe() {
	        _classCallCheck(this, WireChannelSubscribe);

	        this.messageType = 8;
	    }

	    _createClass(WireChannelSubscribe, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.name = obj.name;
	            this.jsonConfig = obj.jsonConfig;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelSubscribe;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelSubscribe.name_IS_SET = 1 << 0;
	WireChannelSubscribe.jsonConfig_IS_SET = 1 << 1;

	var WireChannelUnSubscribe = exports.WireChannelUnSubscribe = function () {
	    function WireChannelUnSubscribe() {
	        _classCallCheck(this, WireChannelUnSubscribe);

	        this.messageType = 9;
	    }

	    _createClass(WireChannelUnSubscribe, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.name = obj.name;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireChannelUnSubscribe;
	}();
	// Bitmask flags for optional field serialization support


	WireChannelUnSubscribe.name_IS_SET = 1 << 0;

	var WireConnectFailure = exports.WireConnectFailure = function () {
	    function WireConnectFailure() {
	        _classCallCheck(this, WireConnectFailure);

	        this.messageType = 10;
	    }

	    _createClass(WireConnectFailure, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.failureMessage = obj.failureMessage;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireConnectFailure;
	}();
	// Bitmask flags for optional field serialization support


	WireConnectFailure.failureMessage_IS_SET = 1 << 0;

	var WireConnectRequest = exports.WireConnectRequest = function () {
	    function WireConnectRequest() {
	        _classCallCheck(this, WireConnectRequest);

	        this.messageType = 11;
	    }

	    _createClass(WireConnectRequest, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.version = obj.version;
	            this.clientKey = obj.clientKey;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireConnectRequest;
	}();
	// Bitmask flags for optional field serialization support


	WireConnectRequest.version_IS_SET = 1 << 0;
	WireConnectRequest.clientKey_IS_SET = 1 << 1;

	var WireConnectSuccess = exports.WireConnectSuccess = function () {
	    function WireConnectSuccess() {
	        _classCallCheck(this, WireConnectSuccess);

	        this.messageType = 12;
	    }

	    _createClass(WireConnectSuccess, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.clientId = obj.clientId;
	            this.clientToServerPingMS = obj.clientToServerPingMS;
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireConnectSuccess;
	}();
	// Bitmask flags for optional field serialization support


	WireConnectSuccess.clientId_IS_SET = 1 << 0;
	WireConnectSuccess.clientToServerPingMS_IS_SET = 1 << 1;

	var WireDisconnectRequest = exports.WireDisconnectRequest = function () {
	    function WireDisconnectRequest() {
	        _classCallCheck(this, WireDisconnectRequest);

	        this.messageType = 13;
	    }

	    _createClass(WireDisconnectRequest, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireDisconnectRequest;
	}();

	var WireDisconnectSuccess = exports.WireDisconnectSuccess = function () {
	    function WireDisconnectSuccess() {
	        _classCallCheck(this, WireDisconnectSuccess);

	        this.messageType = 14;
	    }

	    _createClass(WireDisconnectSuccess, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireDisconnectSuccess;
	}();

	var WirePing = exports.WirePing = function () {
	    function WirePing() {
	        _classCallCheck(this, WirePing);

	        this.messageType = 15;
	    }

	    _createClass(WirePing, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WirePing;
	}();

	var WirePong = exports.WirePong = function () {
	    function WirePong() {
	        _classCallCheck(this, WirePong);

	        this.messageType = 16;
	    }

	    _createClass(WirePong, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WirePong;
	}();

	var WireQueueMessage = exports.WireQueueMessage = function () {
	    function WireQueueMessage() {
	        _classCallCheck(this, WireQueueMessage);

	        this.messageType = 17;
	    }

	    _createClass(WireQueueMessage, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.id = obj.id;
	            this.name = obj.name;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireQueueMessage;
	}();
	// Bitmask flags for optional field serialization support


	WireQueueMessage.id_IS_SET = 1 << 0;
	WireQueueMessage.name_IS_SET = 1 << 1;
	WireQueueMessage.payload_IS_SET = 1 << 2;

	var WireRpcMessage = exports.WireRpcMessage = function () {
	    function WireRpcMessage() {
	        _classCallCheck(this, WireRpcMessage);

	        this.messageType = 18;
	    }

	    _createClass(WireRpcMessage, [{
	        key: "serializeJson",
	        value: function serializeJson() {
	            return JSON.stringify(this);
	        }
	    }, {
	        key: "deserializeJson",
	        value: function deserializeJson(json) {
	            var obj = JSON.parse(json);
	            this.id = obj.id;
	            this.ns = obj.ns;
	            this.payload = new pew.ByteArray(obj.payload);
	        }
	    }, {
	        key: "setPewBitmask",
	        value: function setPewBitmask(flag) {
	            this._pew_bitmask_ |= flag;
	        }
	    }, {
	        key: "unsetPewBitmask",
	        value: function unsetPewBitmask(flag) {
	            this._pew_bitmask_ &= flag;
	        }
	    }, {
	        key: "pewBitmaskIsSetFor",
	        value: function pewBitmaskIsSetFor(flag) {
	            return (this._pew_bitmask_ & flag) == flag;
	        }
	    }]);

	    return WireRpcMessage;
	}();
	// Bitmask flags for optional field serialization support


	WireRpcMessage.id_IS_SET = 1 << 0;
	WireRpcMessage.ns_IS_SET = 1 << 1;
	WireRpcMessage.payload_IS_SET = 1 << 2;
	//# sourceMappingURL=WireProtocol.Protocol.js.map


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16), __webpack_require__(15), __webpack_require__(21), __webpack_require__(22), __webpack_require__(23), __webpack_require__(24), __webpack_require__(31), __webpack_require__(25), __webpack_require__(26), __webpack_require__(27), __webpack_require__(28), __webpack_require__(29), __webpack_require__(30)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('./ApiClient'), require('./model/AuthDeviceRequest'), require('./model/AuthDeviceResponse'), require('./model/AuthResponse'), require('./model/AuthUserRequest'), require('./model/AuthUserResponse'), require('./model/CreateDeviceRequest'), require('./model/CreateDeviceResponse'), require('./model/CreateUserRequest'), require('./model/CreateUserResponse'), require('./model/PingResponse'), require('./model/QueryDevicesResponse'), require('./api/DefaultApi'));
	  }
	})(function (ApiClient, AuthDeviceRequest, AuthDeviceResponse, AuthResponse, AuthUserRequest, AuthUserResponse, CreateDeviceRequest, CreateDeviceResponse, CreateUserRequest, CreateUserResponse, PingResponse, QueryDevicesResponse, DefaultApi) {
	  'use strict';

	  /**
	   * Client library of big-bang-rest-api.<br>
	   * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
	   * <p>
	   * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
	   * <pre>
	   * var BigBangRestApi = require('./index'); // See note below*.
	   * var xxxSvc = new BigBangRestApi.XxxApi(); // Allocate the API class we're going to use.
	   * var yyyModel = new BigBangRestApi.Yyy(); // Construct a model instance.
	   * yyyModel.someProperty = 'someValue';
	   * ...
	   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
	   * ...
	   * </pre>
	   * <em>*NOTE: For a top-level AMD script, use require(['./index'], function(){...}) and put the application logic within the
	   * callback function.</em>
	   * </p>
	   * <p>
	   * A non-AMD browser application (discouraged) might do something like this:
	   * <pre>
	   * var xxxSvc = new BigBangRestApi.XxxApi(); // Allocate the API class we're going to use.
	   * var yyy = new BigBangRestApi.Yyy(); // Construct a model instance.
	   * yyyModel.someProperty = 'someValue';
	   * ...
	   * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
	   * ...
	   * </pre>
	   * </p>
	   * @module index
	   * @version 0.0.1
	   */

	  var exports = {
	    /**
	     * The ApiClient constructor.
	     * @property {module:ApiClient}
	     */
	    ApiClient: ApiClient,
	    /**
	     * The AuthDeviceRequest model constructor.
	     * @property {module:model/AuthDeviceRequest}
	     */
	    AuthDeviceRequest: AuthDeviceRequest,
	    /**
	     * The AuthDeviceResponse model constructor.
	     * @property {module:model/AuthDeviceResponse}
	     */
	    AuthDeviceResponse: AuthDeviceResponse,
	    /**
	     * The AuthResponse model constructor.
	     * @property {module:model/AuthResponse}
	     */
	    AuthResponse: AuthResponse,
	    /**
	     * The AuthUserRequest model constructor.
	     * @property {module:model/AuthUserRequest}
	     */
	    AuthUserRequest: AuthUserRequest,
	    /**
	     * The AuthUserResponse model constructor.
	     * @property {module:model/AuthUserResponse}
	     */
	    AuthUserResponse: AuthUserResponse,
	    /**
	     * The CreateDeviceRequest model constructor.
	     * @property {module:model/CreateDeviceRequest}
	     */
	    CreateDeviceRequest: CreateDeviceRequest,
	    /**
	     * The CreateDeviceResponse model constructor.
	     * @property {module:model/CreateDeviceResponse}
	     */
	    CreateDeviceResponse: CreateDeviceResponse,
	    /**
	     * The CreateUserRequest model constructor.
	     * @property {module:model/CreateUserRequest}
	     */
	    CreateUserRequest: CreateUserRequest,
	    /**
	     * The CreateUserResponse model constructor.
	     * @property {module:model/CreateUserResponse}
	     */
	    CreateUserResponse: CreateUserResponse,
	    /**
	     * The PingResponse model constructor.
	     * @property {module:model/PingResponse}
	     */
	    PingResponse: PingResponse,
	    /**
	     * The QueryDevicesResponse model constructor.
	     * @property {module:model/QueryDevicesResponse}
	     */
	    QueryDevicesResponse: QueryDevicesResponse,
	    /**
	     * The DefaultApi service constructor.
	     * @property {module:api/DefaultApi}
	     */
	    DefaultApi: DefaultApi
	  };

	  return exports;
	});
	//# sourceMappingURL=index.js.map


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.AuthDeviceRequest = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The AuthDeviceRequest model module.
	   * @module model/AuthDeviceRequest
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>AuthDeviceRequest</code>.
	   * @alias module:model/AuthDeviceRequest
	   * @class
	   * @param id
	   * @param secret
	   */

	  var exports = function exports(id, secret) {

	    this['id'] = id;
	    this['secret'] = secret;
	  };

	  /**
	   * Constructs a <code>AuthDeviceRequest</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/AuthDeviceRequest} obj Optional instance to populate.
	   * @return {module:model/AuthDeviceRequest} The populated <code>AuthDeviceRequest</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('id')) {
	        obj['id'] = ApiClient.convertToType(data['id'], 'String');
	      }
	      if (data.hasOwnProperty('secret')) {
	        obj['secret'] = ApiClient.convertToType(data['secret'], 'String');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {String} id
	   */
	  exports.prototype['id'] = undefined;

	  /**
	   * @member {String} secret
	   */
	  exports.prototype['secret'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=AuthDeviceRequest.js.map


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(17)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('superagent'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.ApiClient = factory(root.superagent);
	  }
	})(undefined, function (superagent) {
	  'use strict';

	  /**
	   * @module ApiClient
	   * @version 0.0.1
	   */

	  /**
	   * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
	   * application to use this class directly - the *Api and model classes provide the public API for the service. The
	   * contents of this file should be regarded as internal but are documented for completeness.
	   * @alias module:ApiClient
	   * @class
	   */

	  var exports = function exports() {
	    /**
	     * The base URL against which to resolve every API call's (relative) path.
	     * @type {String}
	     * @default http://localhost:8888/api/v1
	     */
	    this.basePath = 'http://localhost:8888/api/v1'.replace(/\/+$/, '');

	    /**
	     * The authentication methods to be included for all API calls.
	     * @type {Array.<String>}
	     */
	    this.authentications = {};

	    /**
	     * The default HTTP headers to be included for all API calls.
	     * @type {Array.<String>}
	     * @default {}
	     */
	    this.defaultHeaders = {};

	    /**
	     * The default HTTP timeout for all API calls.
	     * @type {Number}
	     * @default 60000
	     */
	    this.timeout = 60000;
	  };

	  /**
	   * Returns a string representation for an actual parameter.
	   * @param param The actual parameter.
	   * @returns {String} The string representation of <code>param</code>.
	   */
	  exports.prototype.paramToString = function (param) {
	    if (param == undefined || param == null) {
	      return '';
	    }
	    if (param instanceof Date) {
	      return param.toJSON();
	    }
	    return param.toString();
	  };

	  /**
	   * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
	   * NOTE: query parameters are not handled here.
	   * @param {String} path The path to append to the base URL.
	   * @param {Object} pathParams The parameter values to append.
	   * @returns {String} The encoded path with parameter values substituted.
	   */
	  exports.prototype.buildUrl = function (path, pathParams) {
	    if (!path.match(/^\//)) {
	      path = '/' + path;
	    }
	    var url = this.basePath + path;
	    var _this = this;
	    url = url.replace(/\{([\w-]+)\}/g, function (fullMatch, key) {
	      var value;
	      if (pathParams.hasOwnProperty(key)) {
	        value = _this.paramToString(pathParams[key]);
	      } else {
	        value = fullMatch;
	      }
	      return encodeURIComponent(value);
	    });
	    return url;
	  };

	  /**
	   * Checks whether the given content type represents JSON.<br>
	   * JSON content type examples:<br>
	   * <ul>
	   * <li>application/json</li>
	   * <li>application/json; charset=UTF8</li>
	   * <li>APPLICATION/JSON</li>
	   * </ul>
	   * @param {String} contentType The MIME content type to check.
	   * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
	   */
	  exports.prototype.isJsonMime = function (contentType) {
	    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
	  };

	  /**
	   * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
	   * @param {Array.<String>} contentTypes
	   * @returns {String} The chosen content type, preferring JSON.
	   */
	  exports.prototype.jsonPreferredMime = function (contentTypes) {
	    for (var i = 0; i < contentTypes.length; i++) {
	      if (this.isJsonMime(contentTypes[i])) {
	        return contentTypes[i];
	      }
	    }
	    return contentTypes[0];
	  };

	  /**
	   * Checks whether the given parameter value represents file-like content.
	   * @param param The parameter to check.
	   * @returns {Boolean} <code>true</code> if <code>param</code> represents a file. 
	   */
	  exports.prototype.isFileParam = function (param) {
	    // fs.ReadStream in Node.js (but not in runtime like browserify)
	    if (typeof window === 'undefined' && "function" === 'function' && __webpack_require__(20) && param instanceof __webpack_require__(20).ReadStream) {
	      return true;
	    }
	    // Buffer in Node.js
	    if (typeof Buffer === 'function' && param instanceof Buffer) {
	      return true;
	    }
	    // Blob in browser
	    if (typeof Blob === 'function' && param instanceof Blob) {
	      return true;
	    }
	    // File in browser (it seems File object is also instance of Blob, but keep this for safe)
	    if (typeof File === 'function' && param instanceof File) {
	      return true;
	    }
	    return false;
	  };

	  /**
	   * Normalizes parameter values:
	   * <ul>
	   * <li>remove nils</li>
	   * <li>keep files and arrays</li>
	   * <li>format to string with `paramToString` for other cases</li>
	   * </ul>
	   * @param {Object.<String, Object>} params The parameters as object properties.
	   * @returns {Object.<String, Object>} normalized parameters.
	   */
	  exports.prototype.normalizeParams = function (params) {
	    var newParams = {};
	    for (var key in params) {
	      if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
	        var value = params[key];
	        if (this.isFileParam(value) || Array.isArray(value)) {
	          newParams[key] = value;
	        } else {
	          newParams[key] = this.paramToString(value);
	        }
	      }
	    }
	    return newParams;
	  };

	  /**
	   * Enumeration of collection format separator strategies.
	   * @enum {String} 
	   * @readonly
	   */
	  exports.CollectionFormatEnum = {
	    /**
	     * Comma-separated values. Value: <code>csv</code>
	     * @const
	     */
	    CSV: ',',
	    /**
	     * Space-separated values. Value: <code>ssv</code>
	     * @const
	     */
	    SSV: ' ',
	    /**
	     * Tab-separated values. Value: <code>tsv</code>
	     * @const
	     */
	    TSV: '\t',
	    /**
	     * Pipe(|)-separated values. Value: <code>pipes</code>
	     * @const
	     */
	    PIPES: '|',
	    /**
	     * Native array. Value: <code>multi</code>
	     * @const
	     */
	    MULTI: 'multi'
	  };

	  /**
	   * Builds a string representation of an array-type actual parameter, according to the given collection format.
	   * @param {Array} param An array parameter.
	   * @param {module:ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
	   * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
	   * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
	   */
	  exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
	    if (param == null) {
	      return null;
	    }
	    switch (collectionFormat) {
	      case 'csv':
	        return param.map(this.paramToString).join(',');
	      case 'ssv':
	        return param.map(this.paramToString).join(' ');
	      case 'tsv':
	        return param.map(this.paramToString).join('\t');
	      case 'pipes':
	        return param.map(this.paramToString).join('|');
	      case 'multi':
	        // return the array directly as SuperAgent will handle it as expected
	        return param.map(this.paramToString);
	      default:
	        throw new Error('Unknown collection format: ' + collectionFormat);
	    }
	  };

	  /**
	   * Applies authentication headers to the request.
	   * @param {Object} request The request object created by a <code>superagent()</code> call.
	   * @param {Array.<String>} authNames An array of authentication method names.
	   */
	  exports.prototype.applyAuthToRequest = function (request, authNames) {
	    var _this = this;
	    authNames.forEach(function (authName) {
	      var auth = _this.authentications[authName];
	      switch (auth.type) {
	        case 'basic':
	          if (auth.username || auth.password) {
	            request.auth(auth.username || '', auth.password || '');
	          }
	          break;
	        case 'apiKey':
	          if (auth.apiKey) {
	            var data = {};
	            if (auth.apiKeyPrefix) {
	              data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
	            } else {
	              data[auth.name] = auth.apiKey;
	            }
	            if (auth['in'] === 'header') {
	              request.set(data);
	            } else {
	              request.query(data);
	            }
	          }
	          break;
	        case 'oauth2':
	          if (auth.accessToken) {
	            request.set({ 'Authorization': 'Bearer ' + auth.accessToken });
	          }
	          break;
	        default:
	          throw new Error('Unknown authentication type: ' + auth.type);
	      }
	    });
	  };

	  /**
	   * Deserializes an HTTP response body into a value of the specified type.
	   * @param {Object} response A SuperAgent response object.
	   * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
	   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
	   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
	   * all properties on <code>data<code> will be converted to this type.
	   * @returns A value of the specified type.
	   */
	  exports.prototype.deserialize = function deserialize(response, returnType) {
	    if (response == null || returnType == null) {
	      return null;
	    }
	    // Rely on SuperAgent for parsing response body.
	    // See http://visionmedia.github.io/superagent/#parsing-response-bodies
	    var data = response.body;
	    if (data == null) {
	      // SuperAgent does not always produce a body; use the unparsed response as a fallback
	      data = response.text;
	    }
	    return exports.convertToType(data, returnType);
	  };

	  /**
	   * Callback function to receive the result of the operation.
	   * @callback module:ApiClient~callApiCallback
	   * @param {String} error Error message, if any.
	   * @param data The data returned by the service call.
	   * @param {String} response The complete HTTP response.
	   */

	  /**
	   * Invokes the REST service using the supplied settings and parameters.
	   * @param {String} path The base URL to invoke.
	   * @param {String} httpMethod The HTTP method to use.
	   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
	   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
	   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
	   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
	   * @param {Object} bodyParam The value to pass as the request body.
	   * @param {Array.<String>} authNames An array of authentication type names.
	   * @param {Array.<String>} contentTypes An array of request MIME types.
	   * @param {Array.<String>} accepts An array of acceptable response MIME types.
	   * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
	   * constructor for a complex type.
	   * @param {module:ApiClient~callApiCallback} callback The callback function.
	   * @returns {Object} The SuperAgent request object.
	   */
	  exports.prototype.callApi = function callApi(path, httpMethod, pathParams, queryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts, returnType, callback) {

	    var _this = this;
	    var url = this.buildUrl(path, pathParams);
	    var request = superagent(httpMethod, url);

	    // apply authentications
	    this.applyAuthToRequest(request, authNames);

	    // set query parameters
	    request.query(this.normalizeParams(queryParams));

	    // set header parameters
	    request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));

	    // set request timeout
	    request.timeout(this.timeout);

	    var contentType = this.jsonPreferredMime(contentTypes);
	    if (contentType) {
	      request.type(contentType);
	    } else if (!request.header['Content-Type']) {
	      request.type('application/json');
	    }

	    if (contentType === 'application/x-www-form-urlencoded') {
	      request.send(this.normalizeParams(formParams));
	    } else if (contentType == 'multipart/form-data') {
	      var _formParams = this.normalizeParams(formParams);
	      for (var key in _formParams) {
	        if (_formParams.hasOwnProperty(key)) {
	          if (this.isFileParam(_formParams[key])) {
	            // file field
	            request.attach(key, _formParams[key]);
	          } else {
	            request.field(key, _formParams[key]);
	          }
	        }
	      }
	    } else if (bodyParam) {
	      request.send(bodyParam);
	    }

	    var accept = this.jsonPreferredMime(accepts);
	    if (accept) {
	      request.accept(accept);
	    }

	    request.end(function (error, response) {
	      if (callback) {
	        var data = null;
	        if (!error) {
	          data = _this.deserialize(response, returnType);
	        }
	        callback(error, data, response);
	      }
	    });

	    return request;
	  };

	  /**
	   * Parses an ISO-8601 string representation of a date value.
	   * @param {String} str The date value as a string.
	   * @returns {Date} The parsed date object.
	   */
	  exports.parseDate = function (str) {
	    return new Date(str.replace(/T/i, ' '));
	  };

	  /**
	   * Converts a value to the specified type.
	   * @param {(String|Object)} data The data to convert, as a string or object.
	   * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
	   * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
	   * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
	   * all properties on <code>data<code> will be converted to this type.
	   * @returns An instance of the specified type.
	   */
	  exports.convertToType = function (data, type) {
	    switch (type) {
	      case 'Boolean':
	        return Boolean(data);
	      case 'Integer':
	        return parseInt(data, 10);
	      case 'Number':
	        return parseFloat(data);
	      case 'String':
	        return String(data);
	      case 'Date':
	        return this.parseDate(String(data));
	      default:
	        if (type === Object) {
	          // generic object, return directly
	          return data;
	        } else if (typeof type === 'function') {
	          // for model type like: User
	          return type.constructFromObject(data);
	        } else if (Array.isArray(type)) {
	          // for array type like: ['String']
	          var itemType = type[0];
	          return data.map(function (item) {
	            return exports.convertToType(item, itemType);
	          });
	        } else if ((typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'object') {
	          // for plain object type like: {'String': 'Integer'}
	          var keyType, valueType;
	          for (var k in type) {
	            if (type.hasOwnProperty(k)) {
	              keyType = k;
	              valueType = type[k];
	              break;
	            }
	          }
	          var result = {};
	          for (var k in data) {
	            if (data.hasOwnProperty(k)) {
	              var key = exports.convertToType(k, keyType);
	              var value = exports.convertToType(data[k], valueType);
	              result[key] = value;
	            }
	          }
	          return result;
	        } else {
	          // for unknown type, return the data directly
	          return data;
	        }
	    }
	  };

	  /**
	   * The default API client implementation.
	   * @type {module:ApiClient}
	   */
	  exports.instance = new exports();

	  return exports;
	});
	//# sourceMappingURL=ApiClient.js.map

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(9).Buffer))

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Module dependencies.
	 */

	var Emitter = __webpack_require__(18);
	var reduce = __webpack_require__(19);

	/**
	 * Root reference for iframes.
	 */

	var root;
	if (typeof window !== 'undefined') { // Browser window
	  root = window;
	} else if (typeof self !== 'undefined') { // Web Worker
	  root = self;
	} else { // Other environments
	  root = this;
	}

	/**
	 * Noop.
	 */

	function noop(){};

	/**
	 * Check if `obj` is a host object,
	 * we don't want to serialize these :)
	 *
	 * TODO: future proof, move to compoent land
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */

	function isHost(obj) {
	  var str = {}.toString.call(obj);

	  switch (str) {
	    case '[object File]':
	    case '[object Blob]':
	    case '[object FormData]':
	      return true;
	    default:
	      return false;
	  }
	}

	/**
	 * Determine XHR.
	 */

	request.getXHR = function () {
	  if (root.XMLHttpRequest
	      && (!root.location || 'file:' != root.location.protocol
	          || !root.ActiveXObject)) {
	    return new XMLHttpRequest;
	  } else {
	    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
	    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
	  }
	  return false;
	};

	/**
	 * Removes leading and trailing whitespace, added to support IE.
	 *
	 * @param {String} s
	 * @return {String}
	 * @api private
	 */

	var trim = ''.trim
	  ? function(s) { return s.trim(); }
	  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

	/**
	 * Check if `obj` is an object.
	 *
	 * @param {Object} obj
	 * @return {Boolean}
	 * @api private
	 */

	function isObject(obj) {
	  return obj === Object(obj);
	}

	/**
	 * Serialize the given `obj`.
	 *
	 * @param {Object} obj
	 * @return {String}
	 * @api private
	 */

	function serialize(obj) {
	  if (!isObject(obj)) return obj;
	  var pairs = [];
	  for (var key in obj) {
	    if (null != obj[key]) {
	      pushEncodedKeyValuePair(pairs, key, obj[key]);
	        }
	      }
	  return pairs.join('&');
	}

	/**
	 * Helps 'serialize' with serializing arrays.
	 * Mutates the pairs array.
	 *
	 * @param {Array} pairs
	 * @param {String} key
	 * @param {Mixed} val
	 */

	function pushEncodedKeyValuePair(pairs, key, val) {
	  if (Array.isArray(val)) {
	    return val.forEach(function(v) {
	      pushEncodedKeyValuePair(pairs, key, v);
	    });
	  }
	  pairs.push(encodeURIComponent(key)
	    + '=' + encodeURIComponent(val));
	}

	/**
	 * Expose serialization method.
	 */

	 request.serializeObject = serialize;

	 /**
	  * Parse the given x-www-form-urlencoded `str`.
	  *
	  * @param {String} str
	  * @return {Object}
	  * @api private
	  */

	function parseString(str) {
	  var obj = {};
	  var pairs = str.split('&');
	  var parts;
	  var pair;

	  for (var i = 0, len = pairs.length; i < len; ++i) {
	    pair = pairs[i];
	    parts = pair.split('=');
	    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
	  }

	  return obj;
	}

	/**
	 * Expose parser.
	 */

	request.parseString = parseString;

	/**
	 * Default MIME type map.
	 *
	 *     superagent.types.xml = 'application/xml';
	 *
	 */

	request.types = {
	  html: 'text/html',
	  json: 'application/json',
	  xml: 'application/xml',
	  urlencoded: 'application/x-www-form-urlencoded',
	  'form': 'application/x-www-form-urlencoded',
	  'form-data': 'application/x-www-form-urlencoded'
	};

	/**
	 * Default serialization map.
	 *
	 *     superagent.serialize['application/xml'] = function(obj){
	 *       return 'generated xml here';
	 *     };
	 *
	 */

	 request.serialize = {
	   'application/x-www-form-urlencoded': serialize,
	   'application/json': JSON.stringify
	 };

	 /**
	  * Default parsers.
	  *
	  *     superagent.parse['application/xml'] = function(str){
	  *       return { object parsed from str };
	  *     };
	  *
	  */

	request.parse = {
	  'application/x-www-form-urlencoded': parseString,
	  'application/json': JSON.parse
	};

	/**
	 * Parse the given header `str` into
	 * an object containing the mapped fields.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */

	function parseHeader(str) {
	  var lines = str.split(/\r?\n/);
	  var fields = {};
	  var index;
	  var line;
	  var field;
	  var val;

	  lines.pop(); // trailing CRLF

	  for (var i = 0, len = lines.length; i < len; ++i) {
	    line = lines[i];
	    index = line.indexOf(':');
	    field = line.slice(0, index).toLowerCase();
	    val = trim(line.slice(index + 1));
	    fields[field] = val;
	  }

	  return fields;
	}

	/**
	 * Check if `mime` is json or has +json structured syntax suffix.
	 *
	 * @param {String} mime
	 * @return {Boolean}
	 * @api private
	 */

	function isJSON(mime) {
	  return /[\/+]json\b/.test(mime);
	}

	/**
	 * Return the mime type for the given `str`.
	 *
	 * @param {String} str
	 * @return {String}
	 * @api private
	 */

	function type(str){
	  return str.split(/ *; */).shift();
	};

	/**
	 * Return header field parameters.
	 *
	 * @param {String} str
	 * @return {Object}
	 * @api private
	 */

	function params(str){
	  return reduce(str.split(/ *; */), function(obj, str){
	    var parts = str.split(/ *= */)
	      , key = parts.shift()
	      , val = parts.shift();

	    if (key && val) obj[key] = val;
	    return obj;
	  }, {});
	};

	/**
	 * Initialize a new `Response` with the given `xhr`.
	 *
	 *  - set flags (.ok, .error, etc)
	 *  - parse header
	 *
	 * Examples:
	 *
	 *  Aliasing `superagent` as `request` is nice:
	 *
	 *      request = superagent;
	 *
	 *  We can use the promise-like API, or pass callbacks:
	 *
	 *      request.get('/').end(function(res){});
	 *      request.get('/', function(res){});
	 *
	 *  Sending data can be chained:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' })
	 *        .end(function(res){});
	 *
	 *  Or passed to `.send()`:
	 *
	 *      request
	 *        .post('/user')
	 *        .send({ name: 'tj' }, function(res){});
	 *
	 *  Or passed to `.post()`:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' })
	 *        .end(function(res){});
	 *
	 * Or further reduced to a single call for simple cases:
	 *
	 *      request
	 *        .post('/user', { name: 'tj' }, function(res){});
	 *
	 * @param {XMLHTTPRequest} xhr
	 * @param {Object} options
	 * @api private
	 */

	function Response(req, options) {
	  options = options || {};
	  this.req = req;
	  this.xhr = this.req.xhr;
	  // responseText is accessible only if responseType is '' or 'text' and on older browsers
	  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
	     ? this.xhr.responseText
	     : null;
	  this.statusText = this.req.xhr.statusText;
	  this.setStatusProperties(this.xhr.status);
	  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
	  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
	  // getResponseHeader still works. so we get content-type even if getting
	  // other headers fails.
	  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
	  this.setHeaderProperties(this.header);
	  this.body = this.req.method != 'HEAD'
	    ? this.parseBody(this.text ? this.text : this.xhr.response)
	    : null;
	}

	/**
	 * Get case-insensitive `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api public
	 */

	Response.prototype.get = function(field){
	  return this.header[field.toLowerCase()];
	};

	/**
	 * Set header related properties:
	 *
	 *   - `.type` the content type without params
	 *
	 * A response of "Content-Type: text/plain; charset=utf-8"
	 * will provide you with a `.type` of "text/plain".
	 *
	 * @param {Object} header
	 * @api private
	 */

	Response.prototype.setHeaderProperties = function(header){
	  // content-type
	  var ct = this.header['content-type'] || '';
	  this.type = type(ct);

	  // params
	  var obj = params(ct);
	  for (var key in obj) this[key] = obj[key];
	};

	/**
	 * Parse the given body `str`.
	 *
	 * Used for auto-parsing of bodies. Parsers
	 * are defined on the `superagent.parse` object.
	 *
	 * @param {String} str
	 * @return {Mixed}
	 * @api private
	 */

	Response.prototype.parseBody = function(str){
	  var parse = request.parse[this.type];
	  return parse && str && (str.length || str instanceof Object)
	    ? parse(str)
	    : null;
	};

	/**
	 * Set flags such as `.ok` based on `status`.
	 *
	 * For example a 2xx response will give you a `.ok` of __true__
	 * whereas 5xx will be __false__ and `.error` will be __true__. The
	 * `.clientError` and `.serverError` are also available to be more
	 * specific, and `.statusType` is the class of error ranging from 1..5
	 * sometimes useful for mapping respond colors etc.
	 *
	 * "sugar" properties are also defined for common cases. Currently providing:
	 *
	 *   - .noContent
	 *   - .badRequest
	 *   - .unauthorized
	 *   - .notAcceptable
	 *   - .notFound
	 *
	 * @param {Number} status
	 * @api private
	 */

	Response.prototype.setStatusProperties = function(status){
	  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
	  if (status === 1223) {
	    status = 204;
	  }

	  var type = status / 100 | 0;

	  // status / class
	  this.status = this.statusCode = status;
	  this.statusType = type;

	  // basics
	  this.info = 1 == type;
	  this.ok = 2 == type;
	  this.clientError = 4 == type;
	  this.serverError = 5 == type;
	  this.error = (4 == type || 5 == type)
	    ? this.toError()
	    : false;

	  // sugar
	  this.accepted = 202 == status;
	  this.noContent = 204 == status;
	  this.badRequest = 400 == status;
	  this.unauthorized = 401 == status;
	  this.notAcceptable = 406 == status;
	  this.notFound = 404 == status;
	  this.forbidden = 403 == status;
	};

	/**
	 * Return an `Error` representative of this response.
	 *
	 * @return {Error}
	 * @api public
	 */

	Response.prototype.toError = function(){
	  var req = this.req;
	  var method = req.method;
	  var url = req.url;

	  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
	  var err = new Error(msg);
	  err.status = this.status;
	  err.method = method;
	  err.url = url;

	  return err;
	};

	/**
	 * Expose `Response`.
	 */

	request.Response = Response;

	/**
	 * Initialize a new `Request` with the given `method` and `url`.
	 *
	 * @param {String} method
	 * @param {String} url
	 * @api public
	 */

	function Request(method, url) {
	  var self = this;
	  Emitter.call(this);
	  this._query = this._query || [];
	  this.method = method;
	  this.url = url;
	  this.header = {};
	  this._header = {};
	  this.on('end', function(){
	    var err = null;
	    var res = null;

	    try {
	      res = new Response(self);
	    } catch(e) {
	      err = new Error('Parser is unable to parse the response');
	      err.parse = true;
	      err.original = e;
	      // issue #675: return the raw response if the response parsing fails
	      err.rawResponse = self.xhr && self.xhr.responseText ? self.xhr.responseText : null;
	      return self.callback(err);
	    }

	    self.emit('response', res);

	    if (err) {
	      return self.callback(err, res);
	    }

	    if (res.status >= 200 && res.status < 300) {
	      return self.callback(err, res);
	    }

	    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
	    new_err.original = err;
	    new_err.response = res;
	    new_err.status = res.status;

	    self.callback(new_err, res);
	  });
	}

	/**
	 * Mixin `Emitter`.
	 */

	Emitter(Request.prototype);

	/**
	 * Allow for extension
	 */

	Request.prototype.use = function(fn) {
	  fn(this);
	  return this;
	}

	/**
	 * Set timeout to `ms`.
	 *
	 * @param {Number} ms
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.timeout = function(ms){
	  this._timeout = ms;
	  return this;
	};

	/**
	 * Clear previous timeout.
	 *
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.clearTimeout = function(){
	  this._timeout = 0;
	  clearTimeout(this._timer);
	  return this;
	};

	/**
	 * Abort the request, and clear potential timeout.
	 *
	 * @return {Request}
	 * @api public
	 */

	Request.prototype.abort = function(){
	  if (this.aborted) return;
	  this.aborted = true;
	  this.xhr.abort();
	  this.clearTimeout();
	  this.emit('abort');
	  return this;
	};

	/**
	 * Set header `field` to `val`, or multiple fields with one object.
	 *
	 * Examples:
	 *
	 *      req.get('/')
	 *        .set('Accept', 'application/json')
	 *        .set('X-API-Key', 'foobar')
	 *        .end(callback);
	 *
	 *      req.get('/')
	 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
	 *        .end(callback);
	 *
	 * @param {String|Object} field
	 * @param {String} val
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.set = function(field, val){
	  if (isObject(field)) {
	    for (var key in field) {
	      this.set(key, field[key]);
	    }
	    return this;
	  }
	  this._header[field.toLowerCase()] = val;
	  this.header[field] = val;
	  return this;
	};

	/**
	 * Remove header `field`.
	 *
	 * Example:
	 *
	 *      req.get('/')
	 *        .unset('User-Agent')
	 *        .end(callback);
	 *
	 * @param {String} field
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.unset = function(field){
	  delete this._header[field.toLowerCase()];
	  delete this.header[field];
	  return this;
	};

	/**
	 * Get case-insensitive header `field` value.
	 *
	 * @param {String} field
	 * @return {String}
	 * @api private
	 */

	Request.prototype.getHeader = function(field){
	  return this._header[field.toLowerCase()];
	};

	/**
	 * Set Content-Type to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.xml = 'application/xml';
	 *
	 *      request.post('/')
	 *        .type('xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 *      request.post('/')
	 *        .type('application/xml')
	 *        .send(xmlstring)
	 *        .end(callback);
	 *
	 * @param {String} type
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.type = function(type){
	  this.set('Content-Type', request.types[type] || type);
	  return this;
	};

	/**
	 * Force given parser
	 *
	 * Sets the body parser no matter type.
	 *
	 * @param {Function}
	 * @api public
	 */

	Request.prototype.parse = function(fn){
	  this._parser = fn;
	  return this;
	};

	/**
	 * Set Accept to `type`, mapping values from `request.types`.
	 *
	 * Examples:
	 *
	 *      superagent.types.json = 'application/json';
	 *
	 *      request.get('/agent')
	 *        .accept('json')
	 *        .end(callback);
	 *
	 *      request.get('/agent')
	 *        .accept('application/json')
	 *        .end(callback);
	 *
	 * @param {String} accept
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.accept = function(type){
	  this.set('Accept', request.types[type] || type);
	  return this;
	};

	/**
	 * Set Authorization field value with `user` and `pass`.
	 *
	 * @param {String} user
	 * @param {String} pass
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.auth = function(user, pass){
	  var str = btoa(user + ':' + pass);
	  this.set('Authorization', 'Basic ' + str);
	  return this;
	};

	/**
	* Add query-string `val`.
	*
	* Examples:
	*
	*   request.get('/shoes')
	*     .query('size=10')
	*     .query({ color: 'blue' })
	*
	* @param {Object|String} val
	* @return {Request} for chaining
	* @api public
	*/

	Request.prototype.query = function(val){
	  if ('string' != typeof val) val = serialize(val);
	  if (val) this._query.push(val);
	  return this;
	};

	/**
	 * Write the field `name` and `val` for "multipart/form-data"
	 * request bodies.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .field('foo', 'bar')
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} name
	 * @param {String|Blob|File} val
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.field = function(name, val){
	  if (!this._formData) this._formData = new root.FormData();
	  this._formData.append(name, val);
	  return this;
	};

	/**
	 * Queue the given `file` as an attachment to the specified `field`,
	 * with optional `filename`.
	 *
	 * ``` js
	 * request.post('/upload')
	 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
	 *   .end(callback);
	 * ```
	 *
	 * @param {String} field
	 * @param {Blob|File} file
	 * @param {String} filename
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.attach = function(field, file, filename){
	  if (!this._formData) this._formData = new root.FormData();
	  this._formData.append(field, file, filename || file.name);
	  return this;
	};

	/**
	 * Send `data` as the request body, defaulting the `.type()` to "json" when
	 * an object is given.
	 *
	 * Examples:
	 *
	 *       // manual json
	 *       request.post('/user')
	 *         .type('json')
	 *         .send('{"name":"tj"}')
	 *         .end(callback)
	 *
	 *       // auto json
	 *       request.post('/user')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // manual x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send('name=tj')
	 *         .end(callback)
	 *
	 *       // auto x-www-form-urlencoded
	 *       request.post('/user')
	 *         .type('form')
	 *         .send({ name: 'tj' })
	 *         .end(callback)
	 *
	 *       // defaults to x-www-form-urlencoded
	  *      request.post('/user')
	  *        .send('name=tobi')
	  *        .send('species=ferret')
	  *        .end(callback)
	 *
	 * @param {String|Object} data
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.send = function(data){
	  var obj = isObject(data);
	  var type = this.getHeader('Content-Type');

	  // merge
	  if (obj && isObject(this._data)) {
	    for (var key in data) {
	      this._data[key] = data[key];
	    }
	  } else if ('string' == typeof data) {
	    if (!type) this.type('form');
	    type = this.getHeader('Content-Type');
	    if ('application/x-www-form-urlencoded' == type) {
	      this._data = this._data
	        ? this._data + '&' + data
	        : data;
	    } else {
	      this._data = (this._data || '') + data;
	    }
	  } else {
	    this._data = data;
	  }

	  if (!obj || isHost(data)) return this;
	  if (!type) this.type('json');
	  return this;
	};

	/**
	 * Invoke the callback with `err` and `res`
	 * and handle arity check.
	 *
	 * @param {Error} err
	 * @param {Response} res
	 * @api private
	 */

	Request.prototype.callback = function(err, res){
	  var fn = this._callback;
	  this.clearTimeout();
	  fn(err, res);
	};

	/**
	 * Invoke callback with x-domain error.
	 *
	 * @api private
	 */

	Request.prototype.crossDomainError = function(){
	  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
	  err.crossDomain = true;

	  err.status = this.status;
	  err.method = this.method;
	  err.url = this.url;

	  this.callback(err);
	};

	/**
	 * Invoke callback with timeout error.
	 *
	 * @api private
	 */

	Request.prototype.timeoutError = function(){
	  var timeout = this._timeout;
	  var err = new Error('timeout of ' + timeout + 'ms exceeded');
	  err.timeout = timeout;
	  this.callback(err);
	};

	/**
	 * Enable transmission of cookies with x-domain requests.
	 *
	 * Note that for this to work the origin must not be
	 * using "Access-Control-Allow-Origin" with a wildcard,
	 * and also must set "Access-Control-Allow-Credentials"
	 * to "true".
	 *
	 * @api public
	 */

	Request.prototype.withCredentials = function(){
	  this._withCredentials = true;
	  return this;
	};

	/**
	 * Initiate request, invoking callback `fn(res)`
	 * with an instanceof `Response`.
	 *
	 * @param {Function} fn
	 * @return {Request} for chaining
	 * @api public
	 */

	Request.prototype.end = function(fn){
	  var self = this;
	  var xhr = this.xhr = request.getXHR();
	  var query = this._query.join('&');
	  var timeout = this._timeout;
	  var data = this._formData || this._data;

	  // store callback
	  this._callback = fn || noop;

	  // state change
	  xhr.onreadystatechange = function(){
	    if (4 != xhr.readyState) return;

	    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
	    // result in the error "Could not complete the operation due to error c00c023f"
	    var status;
	    try { status = xhr.status } catch(e) { status = 0; }

	    if (0 == status) {
	      if (self.timedout) return self.timeoutError();
	      if (self.aborted) return;
	      return self.crossDomainError();
	    }
	    self.emit('end');
	  };

	  // progress
	  var handleProgress = function(e){
	    if (e.total > 0) {
	      e.percent = e.loaded / e.total * 100;
	    }
	    e.direction = 'download';
	    self.emit('progress', e);
	  };
	  if (this.hasListeners('progress')) {
	    xhr.onprogress = handleProgress;
	  }
	  try {
	    if (xhr.upload && this.hasListeners('progress')) {
	      xhr.upload.onprogress = handleProgress;
	    }
	  } catch(e) {
	    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
	    // Reported here:
	    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
	  }

	  // timeout
	  if (timeout && !this._timer) {
	    this._timer = setTimeout(function(){
	      self.timedout = true;
	      self.abort();
	    }, timeout);
	  }

	  // querystring
	  if (query) {
	    query = request.serializeObject(query);
	    this.url += ~this.url.indexOf('?')
	      ? '&' + query
	      : '?' + query;
	  }

	  // initiate request
	  xhr.open(this.method, this.url, true);

	  // CORS
	  if (this._withCredentials) xhr.withCredentials = true;

	  // body
	  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
	    // serialize stuff
	    var contentType = this.getHeader('Content-Type');
	    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
	    if (!serialize && isJSON(contentType)) serialize = request.serialize['application/json'];
	    if (serialize) data = serialize(data);
	  }

	  // set header fields
	  for (var field in this.header) {
	    if (null == this.header[field]) continue;
	    xhr.setRequestHeader(field, this.header[field]);
	  }

	  // send stuff
	  this.emit('request', this);

	  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
	  // We need null here if data is undefined
	  xhr.send(typeof data !== 'undefined' ? data : null);
	  return this;
	};

	/**
	 * Faux promise support
	 *
	 * @param {Function} fulfill
	 * @param {Function} reject
	 * @return {Request}
	 */

	Request.prototype.then = function (fulfill, reject) {
	  return this.end(function(err, res) {
	    err ? reject(err) : fulfill(res);
	  });
	}

	/**
	 * Expose `Request`.
	 */

	request.Request = Request;

	/**
	 * Issue a request:
	 *
	 * Examples:
	 *
	 *    request('GET', '/users').end(callback)
	 *    request('/users').end(callback)
	 *    request('/users', callback)
	 *
	 * @param {String} method
	 * @param {String|Function} url or callback
	 * @return {Request}
	 * @api public
	 */

	function request(method, url) {
	  // callback
	  if ('function' == typeof url) {
	    return new Request('GET', method).end(url);
	  }

	  // url first
	  if (1 == arguments.length) {
	    return new Request('GET', method);
	  }

	  return new Request(method, url);
	}

	/**
	 * GET `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	request.get = function(url, data, fn){
	  var req = request('GET', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.query(data);
	  if (fn) req.end(fn);
	  return req;
	};

	/**
	 * HEAD `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	request.head = function(url, data, fn){
	  var req = request('HEAD', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};

	/**
	 * DELETE `url` with optional callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	function del(url, fn){
	  var req = request('DELETE', url);
	  if (fn) req.end(fn);
	  return req;
	};

	request['del'] = del;
	request['delete'] = del;

	/**
	 * PATCH `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} data
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	request.patch = function(url, data, fn){
	  var req = request('PATCH', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};

	/**
	 * POST `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed} data
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	request.post = function(url, data, fn){
	  var req = request('POST', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};

	/**
	 * PUT `url` with optional `data` and callback `fn(res)`.
	 *
	 * @param {String} url
	 * @param {Mixed|Function} data or fn
	 * @param {Function} fn
	 * @return {Request}
	 * @api public
	 */

	request.put = function(url, data, fn){
	  var req = request('PUT', url);
	  if ('function' == typeof data) fn = data, data = null;
	  if (data) req.send(data);
	  if (fn) req.end(fn);
	  return req;
	};

	/**
	 * Expose `request`.
	 */

	module.exports = request;


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Expose `Emitter`.
	 */

	if (true) {
	  module.exports = Emitter;
	}

	/**
	 * Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
	    obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
	    .push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  function on() {
	    this.off(event, on);
	    fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
	    this._callbacks = {};
	    return this;
	  }

	  // specific event
	  var callbacks = this._callbacks['$' + event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
	    delete this._callbacks['$' + event];
	    return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
	    cb = callbacks[i];
	    if (cb === fn || cb.fn === fn) {
	      callbacks.splice(i, 1);
	      break;
	    }
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
	    , callbacks = this._callbacks['$' + event];

	  if (callbacks) {
	    callbacks = callbacks.slice(0);
	    for (var i = 0, len = callbacks.length; i < len; ++i) {
	      callbacks[i].apply(this, args);
	    }
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks['$' + event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};


/***/ },
/* 19 */
/***/ function(module, exports) {

	
	/**
	 * Reduce `arr` with `fn`.
	 *
	 * @param {Array} arr
	 * @param {Function} fn
	 * @param {Mixed} initial
	 *
	 * TODO: combatible error handling?
	 */

	module.exports = function(arr, fn, initial){  
	  var idx = 0;
	  var len = arr.length;
	  var curr = arguments.length == 3
	    ? initial
	    : arr[idx++];

	  while (idx < len) {
	    curr = fn.call(null, curr, arr[idx], ++idx, arr);
	  }
	  
	  return curr;
	};

/***/ },
/* 20 */
/***/ function(module, exports) {

	

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.AuthDeviceResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The AuthDeviceResponse model module.
	   * @module model/AuthDeviceResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>AuthDeviceResponse</code>.
	   * @alias module:model/AuthDeviceResponse
	   * @class
	   * @param authenticated
	   */

	  var exports = function exports(authenticated) {

	    this['authenticated'] = authenticated;
	  };

	  /**
	   * Constructs a <code>AuthDeviceResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/AuthDeviceResponse} obj Optional instance to populate.
	   * @return {module:model/AuthDeviceResponse} The populated <code>AuthDeviceResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('authenticated')) {
	        obj['authenticated'] = ApiClient.convertToType(data['authenticated'], 'Boolean');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} authenticated
	   */
	  exports.prototype['authenticated'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=AuthDeviceResponse.js.map


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.AuthResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The AuthResponse model module.
	   * @module model/AuthResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>AuthResponse</code>.
	   * @alias module:model/AuthResponse
	   * @class
	   * @param authenticated
	   */

	  var exports = function exports(authenticated) {

	    this['authenticated'] = authenticated;
	  };

	  /**
	   * Constructs a <code>AuthResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/AuthResponse} obj Optional instance to populate.
	   * @return {module:model/AuthResponse} The populated <code>AuthResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('authenticated')) {
	        obj['authenticated'] = ApiClient.convertToType(data['authenticated'], 'Boolean');
	      }
	      if (data.hasOwnProperty('clientKey')) {
	        obj['clientKey'] = ApiClient.convertToType(data['clientKey'], 'String');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} authenticated
	   */
	  exports.prototype['authenticated'] = undefined;

	  /**
	   * @member {String} clientKey
	   */
	  exports.prototype['clientKey'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=AuthResponse.js.map


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.AuthUserRequest = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The AuthUserRequest model module.
	   * @module model/AuthUserRequest
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>AuthUserRequest</code>.
	   * @alias module:model/AuthUserRequest
	   * @class
	   * @param email
	   * @param password
	   */

	  var exports = function exports(email, password) {

	    this['email'] = email;
	    this['password'] = password;
	  };

	  /**
	   * Constructs a <code>AuthUserRequest</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/AuthUserRequest} obj Optional instance to populate.
	   * @return {module:model/AuthUserRequest} The populated <code>AuthUserRequest</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('email')) {
	        obj['email'] = ApiClient.convertToType(data['email'], 'String');
	      }
	      if (data.hasOwnProperty('password')) {
	        obj['password'] = ApiClient.convertToType(data['password'], 'String');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {String} email
	   */
	  exports.prototype['email'] = undefined;

	  /**
	   * @member {String} password
	   */
	  exports.prototype['password'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=AuthUserRequest.js.map


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.AuthUserResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The AuthUserResponse model module.
	   * @module model/AuthUserResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>AuthUserResponse</code>.
	   * @alias module:model/AuthUserResponse
	   * @class
	   * @param authenticated
	   */

	  var exports = function exports(authenticated) {

	    this['authenticated'] = authenticated;
	  };

	  /**
	   * Constructs a <code>AuthUserResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/AuthUserResponse} obj Optional instance to populate.
	   * @return {module:model/AuthUserResponse} The populated <code>AuthUserResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('authenticated')) {
	        obj['authenticated'] = ApiClient.convertToType(data['authenticated'], 'Boolean');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} authenticated
	   */
	  exports.prototype['authenticated'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=AuthUserResponse.js.map


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.CreateDeviceResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The CreateDeviceResponse model module.
	   * @module model/CreateDeviceResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>CreateDeviceResponse</code>.
	   * @alias module:model/CreateDeviceResponse
	   * @class
	   * @param created
	   */

	  var exports = function exports(created) {

	    this['created'] = created;
	  };

	  /**
	   * Constructs a <code>CreateDeviceResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/CreateDeviceResponse} obj Optional instance to populate.
	   * @return {module:model/CreateDeviceResponse} The populated <code>CreateDeviceResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('created')) {
	        obj['created'] = ApiClient.convertToType(data['created'], 'Boolean');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} created
	   */
	  exports.prototype['created'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=CreateDeviceResponse.js.map


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.CreateUserRequest = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The CreateUserRequest model module.
	   * @module model/CreateUserRequest
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>CreateUserRequest</code>.
	   * @alias module:model/CreateUserRequest
	   * @class
	   * @param email
	   * @param password
	   */

	  var exports = function exports(email, password) {

	    this['email'] = email;
	    this['password'] = password;
	  };

	  /**
	   * Constructs a <code>CreateUserRequest</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/CreateUserRequest} obj Optional instance to populate.
	   * @return {module:model/CreateUserRequest} The populated <code>CreateUserRequest</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('email')) {
	        obj['email'] = ApiClient.convertToType(data['email'], 'String');
	      }
	      if (data.hasOwnProperty('password')) {
	        obj['password'] = ApiClient.convertToType(data['password'], 'String');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {String} email
	   */
	  exports.prototype['email'] = undefined;

	  /**
	   * @member {String} password
	   */
	  exports.prototype['password'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=CreateUserRequest.js.map


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.CreateUserResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The CreateUserResponse model module.
	   * @module model/CreateUserResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>CreateUserResponse</code>.
	   * @alias module:model/CreateUserResponse
	   * @class
	   * @param created
	   */

	  var exports = function exports(created) {

	    this['created'] = created;
	  };

	  /**
	   * Constructs a <code>CreateUserResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/CreateUserResponse} obj Optional instance to populate.
	   * @return {module:model/CreateUserResponse} The populated <code>CreateUserResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('created')) {
	        obj['created'] = ApiClient.convertToType(data['created'], 'Boolean');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} created
	   */
	  exports.prototype['created'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=CreateUserResponse.js.map


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.PingResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The PingResponse model module.
	   * @module model/PingResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>PingResponse</code>.
	   * @alias module:model/PingResponse
	   * @class
	   * @param pong
	   */

	  var exports = function exports(pong) {

	    this['pong'] = pong;
	  };

	  /**
	   * Constructs a <code>PingResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/PingResponse} obj Optional instance to populate.
	   * @return {module:model/PingResponse} The populated <code>PingResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('pong')) {
	        obj['pong'] = ApiClient.convertToType(data['pong'], 'Boolean');
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Boolean} pong
	   */
	  exports.prototype['pong'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=PingResponse.js.map


/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.QueryDevicesResponse = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The QueryDevicesResponse model module.
	   * @module model/QueryDevicesResponse
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>QueryDevicesResponse</code>.
	   * @alias module:model/QueryDevicesResponse
	   * @class
	   */

	  var exports = function exports() {};

	  /**
	   * Constructs a <code>QueryDevicesResponse</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/QueryDevicesResponse} obj Optional instance to populate.
	   * @return {module:model/QueryDevicesResponse} The populated <code>QueryDevicesResponse</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('devices')) {
	        obj['devices'] = ApiClient.convertToType(data['devices'], [Object]);
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Array.<Object>} devices
	   */
	  exports.prototype['devices'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=QueryDevicesResponse.js.map


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16), __webpack_require__(22), __webpack_require__(21), __webpack_require__(15), __webpack_require__(24), __webpack_require__(23), __webpack_require__(25), __webpack_require__(31), __webpack_require__(27), __webpack_require__(26), __webpack_require__(28), __webpack_require__(29)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'), require('../model/AuthResponse'), require('../model/AuthDeviceResponse'), require('../model/AuthDeviceRequest'), require('../model/AuthUserResponse'), require('../model/AuthUserRequest'), require('../model/CreateDeviceResponse'), require('../model/CreateDeviceRequest'), require('../model/CreateUserResponse'), require('../model/CreateUserRequest'), require('../model/PingResponse'), require('../model/QueryDevicesResponse'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.DefaultApi = factory(root.BigBangRestApi.ApiClient, root.BigBangRestApi.AuthResponse, root.BigBangRestApi.AuthDeviceResponse, root.BigBangRestApi.AuthDeviceRequest, root.BigBangRestApi.AuthUserResponse, root.BigBangRestApi.AuthUserRequest, root.BigBangRestApi.CreateDeviceResponse, root.BigBangRestApi.CreateDeviceRequest, root.BigBangRestApi.CreateUserResponse, root.BigBangRestApi.CreateUserRequest, root.BigBangRestApi.PingResponse, root.BigBangRestApi.QueryDevicesResponse);
	  }
	})(undefined, function (ApiClient, AuthResponse, AuthDeviceResponse, AuthDeviceRequest, AuthUserResponse, AuthUserRequest, CreateDeviceResponse, CreateDeviceRequest, CreateUserResponse, CreateUserRequest, PingResponse, QueryDevicesResponse) {
	  'use strict';

	  /**
	   * Default service.
	   * @module api/DefaultApi
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new DefaultApi. 
	   * @alias module:api/DefaultApi
	   * @class
	   * @param {module:ApiClient} apiClient Optional API client implementation to use, default to {@link module:ApiClient#instance}
	   * if unspecified.
	   */

	  var exports = function exports(apiClient) {
	    this.apiClient = apiClient || ApiClient.instance;

	    /**
	     * Callback function to receive the result of the authAnon operation.
	     * @callback module:api/DefaultApi~authAnonCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/AuthResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Authenticates a user and returns a token.
	     * @param {module:api/DefaultApi~authAnonCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/AuthResponse}
	     */
	    this.authAnon = function (callback) {
	      var postBody = null;

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json', 'application/octet-stream'];
	      var accepts = ['application/json'];
	      var returnType = AuthResponse;

	      return this.apiClient.callApi('/auth/anonymous', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the authDevice operation.
	     * @callback module:api/DefaultApi~authDeviceCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/AuthDeviceResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Authenticates a device and returns a token.
	     * @param {module:model/AuthDeviceRequest} body body
	     * @param {module:api/DefaultApi~authDeviceCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/AuthDeviceResponse}
	     */
	    this.authDevice = function (body, callback) {
	      var postBody = body;

	      // verify the required parameter 'body' is set
	      if (body == undefined || body == null) {
	        throw "Missing the required parameter 'body' when calling authDevice";
	      }

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = AuthDeviceResponse;

	      return this.apiClient.callApi('/auth/device', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the authUser operation.
	     * @callback module:api/DefaultApi~authUserCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/AuthUserResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Authenticates a user and returns a token.
	     * @param {module:model/AuthUserRequest} body body
	     * @param {module:api/DefaultApi~authUserCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/AuthUserResponse}
	     */
	    this.authUser = function (body, callback) {
	      var postBody = body;

	      // verify the required parameter 'body' is set
	      if (body == undefined || body == null) {
	        throw "Missing the required parameter 'body' when calling authUser";
	      }

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = AuthUserResponse;

	      return this.apiClient.callApi('/auth/user', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the create operation.
	     * @callback module:api/DefaultApi~createCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/CreateDeviceResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Creates a device
	     * @param {module:model/CreateDeviceRequest} body the body
	     * @param {module:api/DefaultApi~createCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/CreateDeviceResponse}
	     */
	    this.create = function (body, callback) {
	      var postBody = body;

	      // verify the required parameter 'body' is set
	      if (body == undefined || body == null) {
	        throw "Missing the required parameter 'body' when calling create";
	      }

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = CreateDeviceResponse;

	      return this.apiClient.callApi('/devices', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the createUser operation.
	     * @callback module:api/DefaultApi~createUserCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/CreateUserResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Creates a user
	     * @param {module:model/CreateUserRequest} body the body
	     * @param {module:api/DefaultApi~createUserCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/CreateUserResponse}
	     */
	    this.createUser = function (body, callback) {
	      var postBody = body;

	      // verify the required parameter 'body' is set
	      if (body == undefined || body == null) {
	        throw "Missing the required parameter 'body' when calling createUser";
	      }

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = CreateUserResponse;

	      return this.apiClient.callApi('/users', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the getPing operation.
	     * @callback module:api/DefaultApi~getPingCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/PingResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Returns a pong to the caller
	     * @param {module:api/DefaultApi~getPingCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/PingResponse}
	     */
	    this.getPing = function (callback) {
	      var postBody = null;

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = PingResponse;

	      return this.apiClient.callApi('/ping', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the headPing operation.
	     * @callback module:api/DefaultApi~headPingCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/PingResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Returns a pong to the caller
	     * @param {module:api/DefaultApi~headPingCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/PingResponse}
	     */
	    this.headPing = function (callback) {
	      var postBody = null;

	      var pathParams = {};
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = PingResponse;

	      return this.apiClient.callApi('/ping', 'HEAD', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the query operation.
	     * @callback module:api/DefaultApi~queryCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/QueryDevicesResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Query devices
	     * @param {Object} opts Optional parameters
	     * @param {String} opts.tags device tag to query
	     * @param {module:api/DefaultApi~queryCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/QueryDevicesResponse}
	     */
	    this.query = function (opts, callback) {
	      opts = opts || {};
	      var postBody = null;

	      var pathParams = {};
	      var queryParams = {
	        'tags': opts['tags']
	      };
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json'];
	      var accepts = ['application/json'];
	      var returnType = QueryDevicesResponse;

	      return this.apiClient.callApi('/devices', 'GET', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };

	    /**
	     * Callback function to receive the result of the resetPassword operation.
	     * @callback module:api/DefaultApi~resetPasswordCallback
	     * @param {String} error Error message, if any.
	     * @param {module:model/CreateUserResponse} data The data returned by the service call.
	     * @param {String} response The complete HTTP response.
	     */

	    /**
	     * Creates a user
	     * @param {String} email user email
	     * @param {module:api/DefaultApi~resetPasswordCallback} callback The callback function, accepting three arguments: error, data, response
	     * data is of type: {module:model/CreateUserResponse}
	     */
	    this.resetPassword = function (email, callback) {
	      var postBody = null;

	      // verify the required parameter 'email' is set
	      if (email == undefined || email == null) {
	        throw "Missing the required parameter 'email' when calling resetPassword";
	      }

	      var pathParams = {
	        'email': email
	      };
	      var queryParams = {};
	      var headerParams = {};
	      var formParams = {};

	      var authNames = [];
	      var contentTypes = ['application/json', 'application/octet-stream'];
	      var accepts = ['application/json'];
	      var returnType = CreateUserResponse;

	      return this.apiClient.callApi('/users/{email}/resetPassword', 'POST', pathParams, queryParams, headerParams, formParams, postBody, authNames, contentTypes, accepts, returnType, callback);
	    };
	  };

	  return exports;
	});
	//# sourceMappingURL=DefaultApi.js.map


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function (root, factory) {
	  if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(16)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
	    // CommonJS-like environments that support module.exports, like Node.
	    module.exports = factory(require('../ApiClient'));
	  } else {
	    // Browser globals (root is window)
	    if (!root.BigBangRestApi) {
	      root.BigBangRestApi = {};
	    }
	    root.BigBangRestApi.CreateDeviceRequest = factory(root.BigBangRestApi.ApiClient);
	  }
	})(undefined, function (ApiClient) {
	  'use strict';

	  /**
	   * The CreateDeviceRequest model module.
	   * @module model/CreateDeviceRequest
	   * @version 0.0.1
	   */

	  /**
	   * Constructs a new <code>CreateDeviceRequest</code>.
	   * @alias module:model/CreateDeviceRequest
	   * @class
	   */

	  var exports = function exports() {};

	  /**
	   * Constructs a <code>CreateDeviceRequest</code> from a plain JavaScript object, optionally creating a new instance.
	   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
	   * @param {Object} data The plain JavaScript object bearing properties of interest.
	   * @param {module:model/CreateDeviceRequest} obj Optional instance to populate.
	   * @return {module:model/CreateDeviceRequest} The populated <code>CreateDeviceRequest</code> instance.
	   */
	  exports.constructFromObject = function (data, obj) {
	    if (data) {
	      obj = obj || new exports();

	      if (data.hasOwnProperty('tags')) {
	        obj['tags'] = ApiClient.convertToType(data['tags'], ['String']);
	      }
	    }
	    return obj;
	  };

	  /**
	   * @member {Array.<String>} tags
	   */
	  exports.prototype['tags'] = undefined;

	  return exports;
	});
	//# sourceMappingURL=CreateDeviceRequest.js.map


/***/ }
/******/ ]);
const pew = require("./PewRuntime");
const wire = require("./WireProtocol.Protocol.js");
const RestApiClient = require('./rest/index.js');
const Channel = require('./Channel');
const ChannelError = require('./ChannelError');
const url = require("url");
const uuid = require('uuid');
const SimpleEventEmitter = require('./SimpleEventEmitter');

export class LoginResult {
}

export class ConnectionError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class CreateDeviceError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class CreateDeviceInfo {
    constructor(id, secret, tags) {
        this.id = id;
        this.secret = secret;
        this.tags = tags;
    }
}
export class CreateUserError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class ResetPasswordError {
    constructor(msg) {
        this.message = msg;
    }

    toString() {
        return this.message;
    }
}
export class ConnectionResult {
}
class ResponseWrapper {
}

export class AbstractBigBangClient extends SimpleEventEmitter {
    constructor(appUrl) {
        super();
        this.bufString = "";
        this._appUrl = appUrl;
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};
        this.rpcRequests = new Map();
    }

    _getRestClient() {
        var api = new RestApiClient.DefaultApi();
        api.apiClient.basePath = this._appUrl + '/api/v1';
        return api;
    }

    connect(callback) {
        throw new Error("abstract");
    }

    connectAsDevice(id, secret, callback) {
        throw new Error('abstract');
    }

    connectAsUser(email, password, callback) {
        throw new Error("abstract");
    }

    createUser(email, password, callback) {
        const api = this._getRestClient();
        var body = new RestApiClient.CreateUserRequest();
        body.email = email;
        body.password = password;

        api.createUser(body, (err, data, response)=> {
            if (err) {
                callback(new CreateUserError("Invalid response.  Check your server URL and try again."));
                return;
            }
            else {
                const json = response.body;
                if (json.created) {
                    callback(null);
                    return;
                }
                else {
                    callback(new CreateUserError(json.userMessage));
                    return;
                }
            }
        });
    }

    authUser(user, password, callback) {
        var api = this._getRestClient();
        var body = new RestApiClient.AuthUserRequest;
        body.email = user;
        body.password = password;

        api.authUser(body, (err, data, response)=> {
            if (err) {
                callback(new ConnectionError('Unable to authenticate user.'), null);
                return;
            }
            else {
                const json = response.body;
                var loginResult = new LoginResult();
                try {
                    loginResult.authenticated = json.authenticated;
                    loginResult.clientKey = json.clientKey;
                    loginResult.message = json.message;
                    callback(null, loginResult);
                    return;
                }
                catch (e) {
                    loginResult.authenticated = false;
                    loginResult.message = e.message;
                    callback(null, loginResult);
                    return;
                }
            }
        });
    }

    authAnon(callback) {
        var api = this._getRestClient();

        api.authAnon((err, data, response) => {
            if (err) {
                //console.error(err);
                callback(new ConnectionError('Unable to authenticate user.'), null);
                return;
            }
            else {
                const json = response.body;
                var loginResult = new LoginResult();
                try {
                    loginResult.authenticated = json.authenticated;
                    loginResult.clientKey = json.clientKey;
                    loginResult.message = json.message;
                    callback(loginResult);
                    return;
                }
                catch (e) {
                    loginResult.authenticated = false;
                    loginResult.message = e.message;
                    callback(loginResult);
                    return;
                }
            }
        })
    }


    resetPassword(email, callback) {
        var api = this._getRestClient();
        api.resetPassword(email, (err, data, response) => {
            if (err) {
                console.error(err);
                callback(new ResetPasswordError("Invalid response.  Check your server URL and try again."));
                return;
            }
            else {
                const json = response.body;
                if (json.reset) {
                    callback(null);
                }
                else {
                    callback(new ResetPasswordError(json.message));
                }
            }
        });
    }

    createDevice(tags, virtual, callback) {
        var api = this._getRestClient();
        var body = new RestApiClient.CreateDeviceRequest();

        if(tags == null ||  !Array.isArray(tags)) {
            tags = [];
        }

        body.tags = tags;
        body.virtual = virtual;

        api.create(body, (err, data, response) => {
            if (err) {
                console.error(err);
                callback(new CreateDeviceError("Invalid response.  Check your server URL and try again."), null);
                return;
            } else {
                const json = response.body;
                callback(null, new CreateDeviceInfo(json.id, json.secret, json.tags));
                return;
            }
        });
    }

    queryDevices(tags, callback) {
        const api = this._getRestClient();
        const opts = {
            tags:tags
        };



        api.query(opts, (err, data, response) => {
            callback(err, response.body);
        });
    }

    authenticateDevice(id, secret, callback) {
        var api = this._getRestClient();
        var body = new RestApiClient.AuthDeviceRequest();
        body.id = id;
        body.secret = secret;

        api.authDevice(body, (err, data, response)=> {
            if (err) {
                console.error(err);
                callback(new ConnectionError('Unable to authenticate device.'), null);
                return;
            }
            else {
                const json = response.body;
                callback(null, json);
                return;
            }
        });
    }


    disconnect() {
        this.sendToServer(new wire.WireDisconnectRequest());
    }

    subscribe(channel, options, callback) {
        if (options instanceof Function) {
            callback = options;
            options = null;
        }
        this.channelSubscribeMap[channel] = callback;
        var msg = new wire.WireChannelSubscribe();
        msg.name = channel;
        this.sendToServer(msg);
    }

    call(endpoint, message, response) {
        var msg = new wire.WireRpcRequest();
        msg.id = uuid.v4();
        msg.channel = null;
        msg.endpoint = endpoint;
        msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(message)));


        this.rpcRequests.set(msg.id, response);

        this.sendToServer(msg);
    }

    getClientId() {
        return this._clientId;
    }

    getChannel(channel) {
        return this.channelMap[channel];
    }

    getDeviceChannel(callback) {
        var c = this.getChannel(this._deviceId);
        if (c) {
            callback(c);
            return;
        }
        else {
            this.subscribe(this._deviceId, (err, channel) => {
                callback(channel);
                return;
            });
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////
    sendToServer(msg) {
        throw new Error("Unimplemented: sendToServer");
    }

    parseAppURL() {
        var parsedUrl = url.parse(this._appUrl, true);

        if (!parsedUrl.port) {
            if (parsedUrl.protocol === 'http:') {
                parsedUrl.port = 80;
            }
            else if (parsedUrl.protocol === 'https:') {
                parsedUrl.port = 443;
            }
            else {

            }
        }
        return parsedUrl;
    }

    onConnect() {
        var req = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    }

    publish(channel, payload) {
        var msg = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    }

    onReceiveText(data) {
        //tack it on, yo
        this.bufString += data;
        while (this.parseTextStream()) {
        }
    }

    parseTextStream() {
        var delimIdx = this.bufString.indexOf(":");
        if (delimIdx != -1) {
            var lenStr = this.bufString.substr(0, delimIdx);
            var msgLen = parseInt(lenStr);
            //Save the earth, recycle.
            if (this.bufString.length < msgLen + 1 + delimIdx) {
                //just give up, leave the bufString alone for now..
                return false;
            }
            else {
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
                }
                else {
                    this.bufString = "";
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }

    onWireChannelJoin(msg) {
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

    onWireChannelLeave(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelLeave(msg);
    }

    onWireChannelMessage(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    }

    onWireQueueMessage(msg) {
        var channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    }

    onWireRpcResponse(msg) {
        const responseHandler = this.rpcRequests.get(msg.id);
        if (responseHandler) {
            responseHandler(msg.error, msg.payload);
        }
        else {
            //something.
        }

        //done!
        this.rpcRequests.delete(msg.id);
    }

    onWireConnectFailure(msg) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    }

    onWireConnectSuccess(msg) {
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

    onWireChannelDataCreate(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg) {
        var channel = this.channelMap[msg.name];
        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }
        channel.onWireChannelDataDelete(msg);
    }

    onWireChannelDataDel(msg) {
        console.log('Unimplemented: onWireChannelDataDel');
    }

    onWireChannelDataPut(msg) {
        console.log('Unimplemented: onWireChannelDataPut');
    }

    onWireDisconnectSuccess(msg) {
        this.emit('disconnected', false);
    }

    onWireChannelUnSubscribe(msg) {
        console.log("Unimplemented: onWireChannelUnSubscribe");
    }

    onWireDisconnectRequest(msg) {
        //not implemented on client
    }

    onWireConnectRequest(msg) {
        //not implemented on client
    }

    onWireChannelSubscribe(msg) {
        console.log('Unimplemented: onWireChannelSubscribe');
    }

    onWirePing(msg) {
        //Turn around and send it back.
        this.sendToServer(new wire.WirePong());
    }

    onWirePong(msg) {
        //Check for liveness at some point if we dont get answers.
    }
}

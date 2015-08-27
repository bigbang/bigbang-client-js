/// <reference path="PewRuntime.ts"/>
/// <reference path="WireProtocol.Protocol.ts"/>

import pew      = require("./PewRuntime");
import wire     = require("./WireProtocol.Protocol");

export class SimpleEventEmitter {
    private _listeners = {};

    public on(event:string, listener:(event:any) => any):void {
        var listeners = this._listeners[event];
        if (!listeners) {
            this._listeners[event] = listeners = [];
        }
        listeners.push(listener);
    }

    public emit(event:string, arg1?:any, arg2?:any, arg3?:any) {
        var listeners = this._listeners[event];

        if (!listeners) {
            return;
        }

        listeners.forEach(function(listener) {
            listener(arg1, arg2, arg3);
        });
    }
}

/**
 * BigBangClient
 *
 * @fires disconnected When the client is disconnected, either from
 * calling disconnect() or through external forces beyond your control.
 */
export interface BigBangClient {
    /**
     * Connect to Big Bang.
     * @param callback
     */
    connect(callback:(err:ConnectionError) => any):void;

    /**
     * Disconnect from BigBang.
     */
    disconnect():void;

    /**
     * Subscribe to the specified channel. If the channel doesn't exist it will
     * be created. Channel creators own the channels they create.
     * @param channel
     * @param options
     * @param callback
     */
    subscribe(channel:string, options?:any, callback?:(err:ChannelError, channel:Channel) =>any):void;

    /**
     * Returns your unique clientId for this connection. The clientId can
     * be used to identify messages from and to you.
     */
    getClientId():string;

    /**
     * Get a reference to the specified channel. The returned Channel object
     * can be used to further interact with the channel.
     * @param channelName
     */
    getChannel(channelName:string):Channel;

    /**
     * Register an event listener for the specified event.
     * @param event
     * @param listener
     */
    on(event:string, listener:(event:any) => any):void;

    /**
     * Create an email/password user
     * @param email
     * @param password
     * @param callback
     */
    createUser( email:string, password:string, callback?:(err:CreateUserError) => any):void;

    /**
     * Reset password.
     * @param email
     * @param callback
     */
    resetPassword( email:String, callback?:(err:ResetPasswordError) => any):void;
}

export class LoginResult {
    authenticated:boolean;
    clientKey:string;
    message:string;
}

export class ConnectionError {
    message:string;

    constructor(msg:string) {
        this.message = msg;
    }

    toString():string {
        return this.message;
    }
}

export class CreateUserError {
    message:string;

    constructor(msg:string) {
        this.message = msg;
    }

    toString():string{
        return this.message;
    }
}

export class ResetPasswordError {
    message:string;

    constructor(msg:string) {
        this.message = msg;
    }

    toString():string{
        return this.message;
    }
}

export class ConnectionResult {
    success:boolean;
    clientId:string;
    // in the case of an error
    message:string;
}

class ResponseWrapper {
    type:string;
    callback:any;
}

export class ChannelError {
    message:string;

    constructor(msg:string) {
        this.message = msg;
    }

    toString():string {
        return this.message;
    }
}

export class ChannelMessage {
    // the sender's client id
    senderId:string;
    channel:Channel;
    payload:pew.ByteArray;
}


/**
 * Channel
 *
 * @fires message When a message is received on the channel.
 * @fires join When someone joins the channel.
 * @fires leave When someone has left the channel.
 */
export class Channel extends SimpleEventEmitter {

    private client:AbstractBigBangClient;

    private responses:{ [name:string]: ResponseWrapper };

    private keySpaces:{ [name:string]: ChannelData };

    private channelPermissions:Array<string>;

    private currentSubscribers:Array<string>;

    private name:string;

    private unsubscribeCallback:any = null;

    constructor(client:AbstractBigBangClient, name:string) {
        super();
        this.client = client;
        this.name = name;
        this.responses = {};
        this.keySpaces = {};
        this.channelPermissions = [];
        this.currentSubscribers = [];

        this.keySpaces["_meta"] = new ChannelData(client, "_meta", this);
        this.keySpaces["def"] = new ChannelData(client, "def", this);


        this.metaKeyspace().on("subs", (doc:any) => {
            var self = this;
            var oldSubs:Array<string> = this.currentSubscribers;
            this.currentSubscribers = this.getSubscribers();

            var diff = this.diff(oldSubs, this.getSubscribers());

            diff.forEach(function (id) {
                if (oldSubs.indexOf(id) != -1) {
                    self.emit('leave', id);
                }
                else {
                    self.emit('join', id);
                }
            });
        });
    }

    /**
     * Get the name of this Channel.
     * @returns {string}
     */
    public getName():string {
        return this.name;
    }

    /**
     * Get either the named ChannelData or the default if no namespace is
     * specified.
     * @param namespace
     * @returns {ChannelData}
     */
    public getChannelData(namespace?:string) {
        namespace = namespace || 'def';
        return this.getOrCreateChannelData(namespace);
    }

    /**
     * Get the clientIds of the current subscribers on this channel.
     * @returns {Array<string>}
     */
    public getSubscribers():Array<string> {
        var subs:Array<string> = [];
        var doc:any = this.metaKeyspace().get("subs");

        if (doc) {
            var subsAry:Array<string> = doc.subs;

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
    public getNamespaces():Array<string> {
        var names:Array<string> = [];

        Object.keys( this.keySpaces).forEach(function(key) {
            if( key !== '_meta') {
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
    public publish(payload:any, callback:(err:ChannelError) => any):void {
        // this is how you send stuff to channel
        // probably needs options
        // "for now" it has to be a JSON object
        if (this.hasPermission("Publish")) {
            this.publishByteArray(new pew.ByteArray(pew.base64_encode(JSON.stringify(payload))));
            if (callback) {
                var err:ChannelError = null;
                callback(err);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to publish on channel."));
            }
        }
    }

    /**
     * Unsubscribe from the specified channel.
     * @param channel
     */
     public unsubscribe(callback:() => any):void {
        var msg:wire.WireChannelUnSubscribe = new wire.WireChannelUnSubscribe();
        msg.name = this.getName();
        this.client.sendToServer(msg);
        this.unsubscribeCallback = callback;
    }


    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////

    onWireChannelMessage(msg:wire.WireChannelMessage):void {
        var channelMessage:ChannelMessage = new ChannelMessage();
        channelMessage.channel = this;
        channelMessage.payload = msg.payload;
        channelMessage.senderId = msg.senderId;
        this.emit('message', channelMessage);
    }

    onWireQueueMessage(msg:wire.WireQueueMessage):void {
        if (msg.id) {
            var wrapper:ResponseWrapper = this.responses[msg.id];

            if (wrapper) {
                delete this.responses[msg.id];

                if (wrapper.type == "json") {
                    wrapper.callback(JSON.parse(pew.base64_decode(msg.payload.getBytesAsBase64())));

                }
                else if (wrapper.type == "bytes") {

                }
                else if (wrapper.type == "string") {

                }
                else {
                    console.error("Failed wire queue message.")
                }
            }
        }
        else {
            console.error("Error mapping response id " + msg.id);
        }
    }

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        this.getOrCreateChannelData(msg.ks).onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete):void {
        var channelData = this.getOrCreateChannelData(msg.ks);
        channelData.onWireChannelDataDelete(msg);
    }

    onWireChannelLeave(msg:wire.WireChannelLeave):void {
        if(this.unsubscribeCallback) {
            this.unsubscribeCallback();
        }
    }

    setChannelPermissions(perms:Array<string>):void {
        this.channelPermissions = perms;
    }

    hasPermission(p:string):boolean {

        var ret:boolean = false;

        this.channelPermissions.forEach(function (perm) {
            if (p == perm) {
                ret = true;
            }
        });

        return ret;
    }

    private diff(a1, a2):Array<string> {
        var a = [], diff = [];
        for (var i = 0; i < a1.length; i++)
            a[a1[i]] = true;
        for (var i = 0; i < a2.length; i++)
            if (a[a2[i]]) delete a[a2[i]];
            else a[a2[i]] = true;
        for (var k in a)
            diff.push(k);
        return diff;
    }


    private listChanged(orig:Array<string>, current:Array<string>):Array<string> {
        var result = [];

        orig.forEach(function (key) {
            if (-1 === current.indexOf(key)) {
                result.push(key);
            }
        }, this);

        return result;
    }

    private metaKeyspace():ChannelData {
        return this.keySpaces["_meta"];
    }

    private publishByteArray(payload:pew.ByteArray):void {
        var msg:wire.WireChannelMessage = new wire.WireChannelMessage();
        msg.name = this.name;
        msg.payload = payload;
        this.client.sendToServer(msg);
    }

    private getOrCreateChannelData(ks:string):ChannelData {
        var cd:ChannelData;

        //backstop for default keyspace
        if (!ks || "def" == ks) {
            cd = this.keySpaces["def"];
        }
        else {
            cd = this.keySpaces[ks];
        }

        if (!cd) {
            cd = new ChannelData(this.client, ks, this);
            this.keySpaces[ks] = cd;
        }
        return cd;
    }
}


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
export class ChannelData extends SimpleEventEmitter {

    private client:AbstractBigBangClient;
    private keySpace:string;
    private channel:Channel;

    private elementMap:{ [key:string] : any }

    constructor(client:AbstractBigBangClient, keySpace:string, channel:Channel) {
        super();
        this.client = client;
        this.keySpace = keySpace;
        this.elementMap = {};
        this.channel = channel;
        this.onWireChannelDataCreate.bind(this);
        this.onWireChannelDataDelete.bind(this);
        this.onWireChannelDataUpdate.bind(this);
    }

    /**
     * Get the value for the specified key.
     * @param key
     * @returns {any}
     */
    public get(key:string):any {
        return this.elementMap[key];
    }

    /**
     * Set a value for the specified key.
     * @param key
     * @param value
     * @param callback
     */
    public put(key:string, value:any, callback:(err:ChannelError)=>any) {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }
        else if (!value) {
            callback(new ChannelError("ChannelData value cannot be null."));
            return;
        }

        if (this.channel.hasPermission("PutChannelData")) {
            var msg:wire.WireChannelDataPut = new wire.WireChannelDataPut();
            msg.key = key;
            msg.ks = this.keySpace;
            msg.name = this.channel.getName();
            msg.payload = new pew.ByteArray(pew.base64_encode(JSON.stringify(value)));
            this.client.sendToServer(msg);

            if (callback) {
                callback(null);
            }
        }
        else {
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
    public remove(key:string, callback:(err:ChannelError)=>any):any {
        if (!key) {
            callback(new ChannelError("ChannelData key cannot be null."));
            return;
        }

        if (this.channel.hasPermission("DelChannelData")) {
            var del:wire.WireChannelDataDel = new wire.WireChannelDataDel();
            del.key = key;
            del.ks = this.keySpace;
            del.name = this.channel.getName();
            this.client.sendToServer(del);

            if (callback) {
                callback(null);
            }
        }
        else {
            if (callback) {
                callback(new ChannelError("No permission to del on this channel."));
            }
        }
    }

    /**
     * Get a list of the keys on this ChannelData.
     * @returns {Array}
     */
    public getKeys():Array<string> {
        var keys = [];

        for (var k in this.elementMap) {
            keys.push(k);
        }
        return keys;
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        var payload:string = msg.payload.getBytesAsUTF8();
        var o:any = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('add', msg.key, o);
        this.emit(msg.key, o, 'add');
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        var payload:string = msg.payload.getBytesAsUTF8();
        var o:any = JSON.parse(payload);
        this.elementMap[msg.key] = o;
        this.emit('update', msg.key, o)
        this.emit(msg.key, o, 'update');
    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete):void {
        delete this.elementMap[msg.key];
        this.emit('remove', msg.key);
        this.emit(msg.key, null, 'remove');
    }
}

export class AbstractBigBangClient extends SimpleEventEmitter implements wire.WireProtocolProtocolListener, BigBangClient {
    wireProtocol;
    _internalConnectionResult;
    _clientId:string;
    _clientKey:string;
    _appUrl:string;


    channelSubscribeMap:{ [channeId:string]: (err:ChannelError, channel:Channel) =>any };

    channelMap:{ [channelId:string]: Channel };


    bufString:string = "";

    constructor(appUrl:string) {
        super();
        this._appUrl = appUrl;
        this.wireProtocol = new wire.WireProtocol();
        this.wireProtocol.listener = this;
        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.channelSubscribeMap = {};
        this.channelMap = {};

    }

    connect(url:any, options?:any, callback?:(err:ConnectionError) => any):void {
        throw new Error("abstract");
    }

    createUser( email:string, password:string, callback?:(err:CreateUserError) => any):void {
        throw new Error("abstract");
    }

    resetPassword( email:String, callback?:(err:ResetPasswordError) => any):void {
        throw new Error("abstract");
    }

    disconnect():void {
        this.sendToServer(new wire.WireDisconnectRequest());
    }

    subscribe(channel:string, options?:any, callback?:(err:ChannelError, channel:Channel) =>any):void {
        if (options instanceof Function) {
            callback = options;
            options = null;
        }

        this.channelSubscribeMap[channel] = callback;
        var msg:wire.WireChannelSubscribe = new wire.WireChannelSubscribe();
        msg.name = channel;
        this.sendToServer(msg);
    }

    getClientId():string {
        return this._clientId;
    }

    getChannel(channel:string):Channel {
        return this.channelMap[channel];
    }

    ////////////////////////////////////////////////////////////////////////////
    // End of public interface
    ////////////////////////////////////////////////////////////////////////////

    sendToServer(msg:pew.PewMessage):void {
        throw new Error("Unimplemented: sendToServer");
    }

    onConnect():void {
        var req:wire.WireConnectRequest = new wire.WireConnectRequest();
        req.clientKey = this._clientKey;
        req.version = 1234;
        this.sendToServer(req);
    }

    publish(channel:string, payload:string):void {
        var msg:wire.WireChannelMessage = new wire.WireChannelMessage();
        msg.name = channel;
        msg.payload = new pew.ByteArray(pew.base64_encode(payload));
        this.sendToServer(msg);
    }

    onReceiveText(data:string):void {
        //tack it on, yo
        this.bufString += data;
        while (this.parseTextStream()) {
            //perhaps not the most elegant..
        }
    }

    parseTextStream():boolean {

        var delimIdx:number = this.bufString.indexOf(":");

        if (delimIdx != -1) {
            var lenStr:string = this.bufString.substr(0, delimIdx);
            var msgLen:number = parseInt(lenStr);

            //Save the earth, recycle.
            if (this.bufString.length < msgLen + 1 + delimIdx) {
                //just give up, leave the bufString alone for now..
                return false;
            }
            else {
                var body:string = this.bufString.substr(delimIdx + 1, msgLen + 1);

                var c:string = body.charAt(body.length - 1);
                if (c != ',') {
                    // TODO: need to explode and kill the client or something here..
                    console.error("TextProtocol decode exception, not terminated with comma");
                }

                var actualBody:string = body.substr(0, body.length - 1);

                //we actually have a message! Wheeee!
                this.wireProtocol.dispatchNetstring(actualBody);

                //pack up the leftovers.
                if (this.bufString.length > msgLen + 1 + delimIdx + 1) {
                    var left:string = this.bufString.substr(msgLen + 1 + delimIdx + 1);
                    this.bufString = left;
                    return true;
                }
                //we are done
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


    onWireChannelJoin(msg:wire.WireChannelJoin) {
        var callback = this.channelSubscribeMap[msg.name];

        var channel:Channel = new Channel(this, msg.name);
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

    onWireChannelLeave(msg:wire.WireChannelLeave) {
        var channel:Channel = this.channelMap[msg.name];
        channel.onWireChannelLeave(msg);
    }

    onWireChannelMessage(msg:wire.WireChannelMessage):void {
        var channel:Channel = this.channelMap[msg.name];
        channel.onWireChannelMessage(msg);
    }

    onWireQueueMessage(msg:wire.WireQueueMessage):void {
        var channel:Channel = this.channelMap[msg.name];
        channel.onWireQueueMessage(msg);
    }


    onWireRpcMessage(msg:wire.WireRpcMessage):void {
        // TODO
    }

    onWireConnectFailure(msg:wire.WireConnectFailure) {
        var cr = new ConnectionResult();
        cr.clientId = null;
        cr.success = false;
        cr.message = msg.failureMessage;
        this._internalConnectionResult(cr);
    }

    onWireConnectSuccess(msg:wire.WireConnectSuccess):void {
        this._clientId = msg.clientId;
        var cr = new ConnectionResult();
        cr.clientId = msg.clientId;
        cr.success = true;
        cr.message = null;
        this._internalConnectionResult(null, cr);

        //Start up clientToServerPing at specified rate
        setInterval(function() {
            this.sendToServer(new wire.WirePing());
        }.bind(this),msg.clientToServerPingMS );

    }

    onWireChannelDataCreate(msg:wire.WireChannelDataCreate):void {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataCreate(msg);
    }

    onWireChannelDataUpdate(msg:wire.WireChannelDataUpdate):void {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataUpdate(msg);
    }

    onWireChannelDataDelete(msg:wire.WireChannelDataDelete) {
        var channel:Channel = this.channelMap[msg.name];

        if (!channel) {
            throw new Error("Channel " + msg.name + " does not exist.");
        }

        channel.onWireChannelDataDelete(msg);
    }

    onWireChannelDataDel(msg:wire.WireChannelDataDel) {
        console.log('Unimplemented: onWireChannelDataDel');
    }

    onWireChannelDataPut(msg:wire.WireChannelDataPut) {
        console.log('Unimplemented: onWireChannelDataPut');
    }

    onWireDisconnectSuccess(msg:wire.WireDisconnectSuccess):void {
        this.emit('disconnected', false);
    }

    onWireChannelUnSubscribe(msg:wire.WireChannelUnSubscribe):void {
        console.log("Unimplemented: onWireChannelUnSubscribe");
    }


    onWireDisconnectRequest(msg:wire.WireDisconnectRequest) {
        //not implemented on client
    }


    onWireConnectRequest(msg:wire.WireConnectRequest) {
        //not implemented on client
    }

    onWireChannelSubscribe(msg:wire.WireChannelSubscribe) {
        console.log('Unimplemented: onWireChannelSubscribe');
    }

    onWirePing( msg:wire.WirePing) {
        //Turn around and send it back.
        this.sendToServer(new wire.WirePong());
    }

    onWirePong( msg:wire.WirePong ) {
        //Check for liveness at some point if we dont get answers.
    }

    /**
     * A terrible, temporary URL parser till we can find a good one that works
     * in Node and browser.
     * @param url
     */
    parseUrl(url:string):any {
        url = url.replace(/\//g, '');
        var comps:string[] = url.split(':');
        var protocol = comps[0];
        var host = comps[1];
        var port:Number = Number(comps[2]) || (protocol === 'http' ? 80 : 443);
        return {
            protocol : protocol,
            host : host,
            port : port
        };
    }
}

var pew = require("./PewRuntime");

var WireProtocol = (function () {
    function WireProtocol() {
        this.protocolId = 0;
        this.protocolHash = '6d57e4b8c8746db1711874a131731111';
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
                var WireQueueMessage_msg = new WireQueueMessage();
                WireQueueMessage_msg.deserializeJson(msgBody);
                this.listener.onWireQueueMessage(WireQueueMessage_msg);

                break;
            case 16:
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
var WireQueueMessage = (function () {
    function WireQueueMessage() {
        this.messageType = 15;
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
        this.messageType = 16;
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

/// <reference path="./../../../src/node.d.ts"/>
/// <reference path="./PewRuntime.ts"/>
/// <reference path="./NodeBigBangClient.ts"/>
import pew      = require("./PewRuntime");
import bigbang  = require("./BigBangClient")
import bbNode   = require("./NodeBigBangClient")
import readline = require("readline")

if (process.argv.length != 3) {
    console.log('Please supply a host.');
    process.exit(1);
}

var rlopt:any = { "input": process.stdin, "output": process.stdout};
var rl = readline.createInterface(rlopt);
var host = process.argv[2];
var jsonMode = true;

//Patch up host argument.  We require a port specified for now..
if (host.indexOf(":") <= 0) {
    host += ":80";
}

var client:bigbang.client.BigBangClient = new bbNode.NodeBigBangClient();
var myChannel:bigbang.client.Channel;

client.disconnected(function () {
    console.log("The socket was disconnected, bye.");
});

console.log("Connecting to host " + host);

//Make anonymous connection to your Big Bang instance.
//Currently host needs to be in form of 'host:port'
client.connectAnonymous(host, function (result:bigbang.client.ConnectionResult) {
    if (result.success) {
        printToConsole("Connected!");
        startCli();
    }
    else {
        console.log('Failed to connect. ' + result.message);
    }
});

function startCli() {
    updatePrompt();
    rl.prompt();
    console.log("JSON mode is "+ jsonMode +".  Use 'mode' to toggle.");

    rl.on('line',function (raw) {
        var line:string = raw.trim();

        if (startsWith(line, "ls")) {
            doLs();
        }
        else if (startsWith(line, "put")) {
            doPut(line);
        }
        else if (startsWith(line, "del")) {
            doDel(line);
        }
        else if (startsWith(line, "pub ")) {
            doPublish(line);
        }
        else if (startsWith(line, "subs ")) {
            subscribeCommand(line);
        }
        else if (startsWith(line, "whoami")) {
            whoami();
        }
        else if (startsWith(line, "mode")) {
            jsonMode = !jsonMode;
            console.log("JSON mode is " + jsonMode);
        }

        rl.prompt();
    }).on('close', function () {
            console.log('Bye!');
            process.exit(0);
        });
}


function updatePrompt() {
    var promptStr = host + "@";

    if (myChannel) {
        promptStr += myChannel.name;
    }

    promptStr += ">";

    rl.setPrompt(promptStr, promptStr.length);
}

function doLs() {

    if (myChannel) {

        myChannel.channelData.keys().forEach(function (key:string) {
            var o:any = myChannel.channelData.get(key);
            console.log(key + "=> " + JSON.stringify(o));

        });
        console.log("");

        console.log("subscribers: " + myChannel.subscribers());
        printToConsole("");
    }
    else {
        printToConsole("Not subscribed to a channel.");
    }
}

function printToConsole(obj) {
    console.log(obj);
    rl.prompt();
}

function subscribeCommand(line:string) {
    var args:string[] = line.split(" ");
    client.subscribe(args[1], function (err:bigbang.client.ChannelError, channel:bigbang.client.Channel) {
        myChannel = channel;

        updatePrompt();

        myChannel.onSubscribers(function (joined) {
            printToConsole("Subscriber " + joined + " joined channel " + myChannel.name);
        }, function (left) {
            printToConsole("Subscriber " + left + " left channel " + myChannel.name);
        });

        myChannel.channelData.onValue(function (key, val) {
            printToConsole("key " + key + " added.");
        }, function (key, val) {
            printToConsole("key " + key + " updated.");
        }, function (key) {
            printToConsole("key " + key + " deleted.");
        });
        printToConsole("Subscribed to " + channel.name);
        channel.onMessage(function (msg:bigbang.client.ChannelMessage) {
            printToConsole("channel[" + channel.name + "] senderId[" + msg.senderId + "] " + msg.payload.getBytesAsUTF8());
        });
    });
}

function doPut(line:string) {

    if (myChannel) {
        var key:string = line.split(" ")[1];

        var o;

        if (jsonMode) {
            o = lineAsJson(line, 2);
        }
        else {
            o = lineToJson(line, 2);
        }

        if (o) {

            myChannel.channelData.put(key, o, function (err) {
                if (err) {
                    console.log("Put error: " + err);
                }
            });
        }
    }
    else {
        printToConsole("Subscribe to a channel first.");
    }
}


function doDel(line:string) {
    var key:string = line.split(" ")[1];
    myChannel.channelData.del(key, function (err) {
        if (err) {
            console.log("channelData Del error: " + err);
        }
    });
}

function doPublish(line:string) {


    if (myChannel) {

        var o;

        if (jsonMode) {
            o = lineAsJson(line, 1);
        }
        else {
            o = lineToJson(line, 1);
        }

        if (o) {
            myChannel.publish(o, function (err) {
                if (err) {
                    console.log("Publish error:" + err);
                }
            });
        }
    }
    else {
        printToConsole("Subscribe to a channel first.");
    }
}

function whoami():void {
    printToConsole("You are " + client.clientId());
}

function startsWith(s:string, search:string):boolean {
    return s.substring(0, search.length) == search;
}

function lineToJson(line:string, start:number):any {

    var o:any = {};
    var ary:string[] = line.split(" ");

    if (( ary.length - start ) % 2 != 0) {
        printToConsole("Unmatched parameters, couldn't create JSON object.");
        return null;
    }

    for (var i = start; i < ary.length; i = i + 2) {
        o[ary[i]] = ary[i + 1];
    }

    return o;
}

function lineAsJson(line:string, skip:number):any {
    var ary:string[] = line.split(" ");

    var pre:string = "";

    for (var i = skip; i < ary.length; i++) {
        pre += ary[i];
    }
    try {
        return JSON.parse(pre);
    }
    catch (ex) {
        printToConsole(pre + " was not valid JSON.");
    }
}

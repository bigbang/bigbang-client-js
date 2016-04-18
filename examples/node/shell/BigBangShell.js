var bigbang = require("bigbang.io");
var readline = require("readline");
var freetree = require('ascii-tree');

if (process.argv.length != 3) {
    console.log('Please supply a host.');
    process.exit(1);
}

var rl = readline.createInterface({ "input": process.stdin, "output": process.stdout });
var host = process.argv[2];
var jsonMode = true;

var client = new bigbang.Client( host );
var myChannel;

client.on('disconnected', function () {
    console.log("The socket was disconnected, bye.");
});

console.log("Connecting to host " + host);

//Make anonymous connection to your Big Bang instance.
//Currently host needs to be in form of 'host:port'
client.connect(function (err) {
    if (err) {
        console.log('Failed to connect. ' + JSON.stringify(err));
    } else {
        printToConsole("Connected!");
        startCli();
    }
});

function startCli() {
    updatePrompt();
    rl.prompt();
    console.log("JSON mode is " + jsonMode + ".  Use 'mode' to toggle.");

    rl.on('line',function (raw) {
        var line = raw.trim();

        if (startsWith(line, "ls")) {
            doLs();
        } else if (startsWith(line, "put")) {
            doPut(line);
        } else if (startsWith(line, "del")) {
            doDel(line);
        } else if (startsWith(line, "pub ")) {
            doPublish(line);
        } else if (startsWith(line, "sub ")) {
            subscribeCommand(line);
        } else if (startsWith(line, 'unsub')) {
            leaveCommand(line);
        } else if (startsWith(line, "whoami")) {
            whoami();
        } else if (startsWith(line, "mode")) {
            jsonMode = !jsonMode;
            console.log("JSON mode is " + jsonMode);
        }
        else if (startsWith(line, "tp")) {
            testPublish();
        }
        else if ( startsWith(line, "pp")) {
            testPut();
        }
        else if (line.length == 0) {
            //swallow empty commands
            rl.prompt();
        }
        else {
            printToConsole("Unknown command: " + line);
        }

    }).on('close', function () {
            console.log('Bye!');
            process.exit(0);
        });
}

function updatePrompt() {
    var promptStr = host + "@";

    if (myChannel) {
        promptStr += myChannel.getName();
    }

    promptStr += ">";

    rl.setPrompt(promptStr, promptStr.length);
}

function doLs() {
    if (myChannel) {

        var treeStr = "#" + myChannel.getName() + "\n";

        treeStr += "##Subscribers" + "\n";
        myChannel.getSubscribers().forEach(function (sub) {
            treeStr += "###" + sub + "\n";
        });

        treeStr += "##Namespaces" + "\n";

        myChannel.getNamespaces().forEach(function (ns) {
            treeStr += "###" + ns + "\n";

            var channelData = myChannel.getChannelData(ns);

            channelData.getKeys().forEach(function (key) {
                var o = channelData.get(key);

                treeStr += "####" + key + " => " + JSON.stringify(o) + "\n";
            });
        });

        printToConsole(freetree.generate(treeStr));
    } else {
        printToConsole("Not subscribed to a channel.");
    }
}

function printToConsole(obj) {
    console.log(obj);
    rl.prompt();
}

function subscribeCommand(line) {
    var args = line.split(" ");
    client.subscribe(args[1], function (err, channel) {
        myChannel = channel;

        updatePrompt();

        myChannel.on('join', function (joined) {
            printToConsole("Subscriber " + joined + " joined channel " + myChannel.getName());
        });

        myChannel.on('leave', function (left) {
            printToConsole("Subscriber " + left + " left channel " + myChannel.getName());
        });

        myChannel.getChannelData().on('add', function (key, val) {
            printToConsole("key added => " + key);
        });

        myChannel.getChannelData().on('update', function (key, value) {
            printToConsole("key updated => " + key);
        });

        myChannel.getChannelData().on('remove', function (key) {
            printToConsole("key removed => " + key);
        });

        printToConsole("Subscribed to " + channel.getName());
        channel.on('message', function (msg) {
            printToConsole("channel[" + channel.getName() + "] senderId[" + msg.senderId + "] " + msg.payload.getBytesAsUTF8());
        });
    });
}

function leaveCommand(line) {
    myChannel.unsubscribe(function () {
        myChannel = null;
        updatePrompt();
    });
}


function doPut(line) {
    if (myChannel) {
        var key = line.split(" ")[1];

        var o;

        if (jsonMode) {
            o = lineAsJson(line, 2);
        } else {
            o = lineToJson(line, 2);
        }

        if (o) {
            myChannel.getChannelData().put(key, o, function (err) {
                if (err) {
                    console.log("Put error: " + err);
                }
            });
        }
    } else {
        printToConsole("Subscribe to a channel first.");
    }
}

function doDel(line) {
    var key = line.split(" ")[1];
    myChannel.getChannelData().remove(key, function (err) {
        if (err) {
            console.log("channelData Del error: " + err);
        }
    });
}

function doPublish(line) {
    if (myChannel) {
        var o;

        if (jsonMode) {
            o = lineAsJson(line, 1);
        } else {
            o = lineToJson(line, 1);
        }

        if (o) {
            myChannel.publish(o, function (err) {
                if (err) {
                    console.log("Publish error:" + err);
                }
            });
        }
    } else {
        printToConsole("Subscribe to a channel first.");
    }
}

function whoami() {
    printToConsole("You are " + client.getClientId());
}

var tpnum =0;
function testPublish() {

    var msg = {
        foo:"bar",
        num:tpnum
    }
    doPublish("tp " +JSON.stringify(msg));
    tpnum+=1;
}

var drools =0;
function testPut() {
    var msg ={
        drool: "bat",
        drools: drools
     };
     drools+=1;

     doPut( "put foo " + JSON.stringify(msg));

}


function startsWith(s, search) {
    return s.substring(0, search.length) == search;
}

function lineToJson(line, start) {
    var o = {};
    var ary = line.split(" ");

    if ((ary.length - start) % 2 != 0) {
        printToConsole("Unmatched parameters, couldn't create JSON object.");
        return null;
    }

    for (var i = start; i < ary.length; i = i + 2) {
        o[ary[i]] = ary[i + 1];
    }

    return o;
}

function lineAsJson(line, skip) {
    var ary = line.split(" ");

    var pre = "";

    for (var i = skip; i < ary.length; i++) {
        pre += ary[i];
    }
    try {
        return JSON.parse(pre);
    } catch (ex) {
        printToConsole(pre + " was not valid JSON.");
    }
}

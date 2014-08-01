require.config({
    baseUrl: './lib/tmp',
    paths: {
        "BrowserBigBangClient": "BrowserBigBangClient"
    }
});

require(['BrowserBigBangClient'], function (bigbang) {
    var client;
    var connectCount = 0;
    init();


    function init() {
        client = new bigbang.client.BrowserBigBangClient();

        client.disconnected(function () {
            console.log("Disconnected.");
            setTimeout(function () {
                init();
            }, 500);
        });

        client.connectAnonymous("devapplication.dev:8000", function (result) {
            if (result.success) {
                connectCount++;
                console.log("Connect " + connectCount);
                client.subscribe("bot", function (err, channel) {
                    if (err) {
                        console.log("Error on subscribe :" + err);
                    }
                    else {
                        var counter = 0;
                        var interval = setInterval(function () {


                            if (counter >= 10) {
                                clearInterval(interval);
                                client.disconnect();
                            }

                            var msg = {};
                            msg.count = counter++;

                            channel.channelData.put(client.clientId(), msg, function (err) {
                                if (err) {
                                    console.error("channelData error: " + err);
                                }
                            });


                        }, 100);


                    }
                });
            }
            else {
                console.log('epic fail. ' + result.message);
            }
        });
    }
});

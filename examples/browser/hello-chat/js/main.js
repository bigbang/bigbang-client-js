var chatChannel;

$(document).ready(function () {

    //Create an instance of the BigBangClient
    var client = new BigBang.Client();

    //Big Bang demo server.
    var host = "https://demo.bigbang.io";

    client.connect(host, function (err) {

        if (err) {
            alert("Failed to connect to " + host + " " + err);
            return;
        }

        client.subscribe("helloChat", function (err, channel) {
            if (err) {
                alert("Unable to subscribe to channel");
                return;
            }
            chatChannel = channel;

            beginChat(channel);
        });
    });

    function beginChat(channel) {

        channel.on('message', function (msg) {
            writeMessage(msg.senderId, msg.payload.getBytesAsJSON().msg);
        });

        channel.on('join', function (joined) {
            writeMessage(joined, "Joined the channel.");
        });

        channel.on('leave', function (leave) {
            writeMessage(left, "Left the channel.");
        });

        $('#sendie').keyup(function (e) {
            if (e.keyCode == 13) {
                var text = $(this).val();
                channel.publish({msg: text});
                $(this).val("");
            }
        });
    }

    function writeMessage(clientId, text) {
        var icon = new Identicon(clientId, 32).toString();

        var img;

        if( clientId === client.getClientId()) {
            img = "<img id='chat-left' src='data:image/png;base64," + icon + "'>";
            $('#chat-area').append($("<p>" + text + img + "<br style='clear: both;' />  </p>"));
        }
        else {
            img = "<img id='chat-right' src='data:image/png;base64," + icon + "'>";
            $('#chat-area').append($("<p>" + text + img + "<br style='clear: both;' />  </p>"));
        }

        document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight;
    }
});

function handleClick(e) {
    var text = $('#sendie').val();
    chatChannel.publish({msg: text});
    $('#sendie').val("");
}
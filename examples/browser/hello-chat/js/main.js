var chatChannel;


$(document).ready(function () {
    //Big Bang demo server.
    var host = "https://demo.bigbang.io";

    //Create an instance of the BigBangClient
    var client = new BigBang.Client(host);

    client.connect(function (err) {

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


            channel.on('message', function (msg) {
                //We can take different actions depending on who sent the message.
                var align = msg.senderId === client.getClientId() ? 'left' : 'right';

                writeMessage(msg.senderId, align, msg.payload.getBytesAsJSON().msg);
            });

            channel.on('join', function (joined) {
                var message = (joined === client.getClientId()) ? "You joined the chat." : " joined the chat.";
                writeMessage(joined, 'left', message);
            });

            channel.on('leave', function (leave) {
                writeMessage(leave, 'left', "left the chat.");
            });

            //Send the message if the user hits enter.
            $('#sender').keyup(function (e) {
                if (e.keyCode == 13) {
                    handleClick(e);
                }
            });
        });
    });

    function writeMessage(clientId, align, text) {

        var icon = new Identicon(clientId, 32).toString();
        var image = "<img class='media-object' src='data:image/png;base64," + icon + "'>";
        var mediaRoot = $('<div class="media"></div>');
        var link = $('<a href="#"></a>')
        var mediaLeft = $('<div class="media-left media-middle"></div>')
        var mediaRight = $('<div class="media-right media-middle"></div>')
        var mediaBody = $('<div class="media-body"></div>').append(text);

        link.append(image);

        if (align === 'left') {
            mediaLeft.append(link);
            mediaRoot.append(mediaLeft);
            mediaRoot.append(mediaBody);
        }
        else {
            mediaRight.append(link);
            mediaRoot.append(mediaBody);
            mediaRoot.append(mediaRight);
        }

        $('#chat-area').append(mediaRoot);
        document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight;
    }
});

function handleClick(e) {
    var text = $('#sender').val();
    chatChannel.publish({msg: text});
    $('#sender').val("");
}
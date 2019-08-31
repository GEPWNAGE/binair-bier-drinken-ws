const express = require('express');
require('dotenv').config();
const app = express();
const proxy = require('express-http-proxy');
require('express-ws')(app);

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateIdent()
{
    let num = getRandomInt(0, 0x100000000);
    return num.toString(16).padStart(8, '0');
}

let screens = {};
let remotes = {};

app.ws('/remote', (ws, req) => {
    let ident = null;

    ws.on('message', msg => {
        const command = msg.split(' ');
        console.log("Remote", command);

        // check if connection with screen still works
        if (ident !== null && screens[ident].readyState > 1) {
            // disconnected
            ws.send("QUIT");
            return;
        }

        switch (command[0]) {
            case 'IDENT':
                if (command.length < 2) {
                    ws.send('IDENT-FAIL');
                    ws.terminate();
                    return;
                }
                ident = command[1];
                if (!(ident in screens)) {
                    ws.send('IDENT-FAIL');
                    ws.terminate();
                    return;
                }
                if (screens[ident].readyState != 1) {
                    ws.send('IDENT-FAIL');
                    ws.terminate();
                    return;
                }

                screens[ident].send('REMOTE-CONNECTED');
                remotes[ident] = ws;
                ws.send('IDENT-SUCCESS');
                break;
            case 'PLAYERS':
            case 'START':
                screens[ident].send(msg);
                break;
        }
    });
});

app.ws('/screen', (ws, req) => {
    const ident = generateIdent();
    ws.on('message', msg => {
        const command = msg.split(' ');
        console.log("Screen", command);

        switch (command[0]) {
            case 'GET-IDENT':
                screens[ident] = ws;
                ws.send("IDENT " + ident);
                break;
            case 'FINISHED':
                if (ident in remotes && remotes[ident].readyState == 1) {
                    remotes[ident].send(msg);
                }
                break;
        }
    });
});

if (process.env.APP_ENV === 'development') {
    app.use('/', proxy('localhost:3000'));
}

app.listen(5000, () => console.log("Listening..."));

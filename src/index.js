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
                    ws.send('IDENT-FAIL bad');
                    ws.terminate();
                    return;
                }
                ident = command[1];
                if (!(ident in screens)) {
                    ws.send('IDENT-FAIL not-found');
                    ws.terminate();
                    return;
                }
                if (screens[ident].readyState != 1) {
                    ws.send('IDENT-FAIL screen-disconnected');
                    ws.terminate();
                    return;
                }

                screens[ident].send('REMOTE-CONNECTED');
                remotes[ident] = ws;
                ws.send('IDENT-SUCCESS');
                break;
            case 'PING':
                ws.send('PONG');
                break;
            case 'PLAYERS':
            case 'START':
                screens[ident].send(msg);
                break;
        }
    });
});

app.ws('/screen', (ws, req) => {
    let ident = generateIdent();
    ws.on('message', msg => {
        const command = msg.split(' ');
        console.log("Screen", command);

        switch (command[0]) {
            case 'GET-IDENT':
                screens[ident] = ws;
                ws.send("IDENT " + ident);
                break;
            case 'SET-IDENT':
                ident = command[1];
                screens[ident] = ws;
                ws.send("IDENT " + ident);
                break;
            case 'FINISHED':
                if (ident in remotes && remotes[ident].readyState == 1) {
                    remotes[ident].send(msg);
                }
                break;
            case 'PING':
                ws.send('PONG');
                break;
        }
    });
});

if (process.env.APP_ENV === 'development') {
    app.use('/', proxy('localhost:3000'));
}
if (process.env.APP_ENV === 'production') {
    app.use('/', express.static(process.env.APP_DIR, {
        // cache one day (maxAge is in ms, unlike in the cache-control header)
        maxAge: 24*3600*1000
    }));

    app.get('/remote/:handle', (req, res) => {
        // cache remote requests for one day as well (this is in seconds)
        res.set('Cache-Control', 'public, max-age=' + (24*3600));
        res.sendFile(process.env.APP_DIR + "/index.html")
    });
}

app.listen(5000, () => console.log("Listening..."));

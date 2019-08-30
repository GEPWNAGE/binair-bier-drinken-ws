# Protocol specification

Every message consists of a single command identifier (uppercase, with dashes,
`-`) and zero or more arguments. All separated by spaces. An example message is:

```
START 4 50
```

## Screen

### Establishing a connection

When a user initiates remote control from the screen, the screen will open a
websocket to `/screen`. Immediately, it will send the following message:

```
GET-IDENT
```

The server will respond with:

```
IDENT {x}
```

Where `{x}` is an alphanumeric string of 8 characters, which uniquely identifies the screen.

### Remote connects

The moment a remote connects, the server will send the following message:

```
REMOTE-CONNECTED
```

### Setting the number of players

If a remote wants to change the number of players, a remote can send the
following message, which is forwarded to the screen:

```
PLAYERS {p}
```

Where `{p}` is the new number of players.

Note: this is just for ux purposes. The number of players given in
the `START` command will always be used by the screen.

### Starting a game

When a remote wants to start a game, the following message is forwarded to the screen:

```
START {p} {d}
```

Where `{p}` is the number of players and `{d}` is the difficulty.

TODO: see if we need an acknowledgement of the game being started by the screen.

### End of the game

When a game is finished, the screen will send the following message to the
server:

```
FINISHED {n}
```

Where `{n}` is the number with which the game has ended.

## Remote

### Establishing a connection

When a remote wants to connect to a screen, it sends the following message:

```
IDENT {x}
```

Where `{x}` is the alphanumeric identifier of the screen. 

When succesful, the server will respond with:

```
IDENT-SUCCESS
```

If not succesful, the server will respond with:

```
IDENT-FAIL
```

And close the connection.

### Setting the number of players

If a remote wants to change the number of players, a remote can send the
following message (which will be forwarded to the screen):

```
PLAYERS {p}
```

Where `{p}` is the new number of players.

Note: this is just for ux purposes. The number of players given in the `START`
command will always be used by the screen for the game.

### Starting a game

When a remote wants to start a game, the following message can be sent to the server:

```
START {p} {d}
```

Where `{p}` is the number of players and `{d}` is the difficulty.

TODO: see if we need an acknowledgement of the game being started by the screen.

### End of the game

When a game is finished, the screen will send the following message to the
server, which is forwarded to the client:

```
FINISHED {n}
```

Where `{n}` is the number with which the game has ended.

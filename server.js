const http = require('http');
const WebSocket = require('websocket').server;

const { Player , DataBaz } = require("./databaz");

const server = http.createServer();
server.listen(80);

const wss = new WebSocket({
    httpServer: server
});

const db = new DataBaz();

wss.addListener('request', function(request) {
    const connection = request.accept(null, request.origin);
    const player = new Player("", connection);
    db.addPlayer(player);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            const data = JSON.parse(message.utf8Data);
            switch(data.type) {
                case "establish":
                    player.id = data.data.id;
                    player.name = data.data.name;
                    player.position = data.data.position;
                    console.log(`${player.id}[${player.name}] has joined.`);
                    db.broadcastMessage({id: "Server", name: "Server"}, `${player.name || player.id} has joined.`);
                    db.broadcastJoin(player);
                    player.sendMessage({
                        type: "player-bc",
                        event: "add",
                        data: db.players.map(p => ({id: p.id, position: p.position})).filter(p => p.id !== player.id)
                    });
                break;
                case "chat":
                    console.log(`From ${player.id}: `, data.data.message);
                    db.broadcastMessage(player, data.data.message);
                break;
                case "update":
                    player.position = data.data.position;
                break;
            }
        }
    });
    connection.on('close', function(connection) {
        db.removePlayer(player);
        console.log(`${player.id} has left.`);
        db.broadcastMessage({id: "Server", name: "Server"}, `${player.id}[${player.name || player.id}] has left.`);
        db.broadcastLeave(player);
    });
});


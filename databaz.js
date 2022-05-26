const WebSocket = require('websocket').server;
const connection = require('websocket').connection;

class Player {
    /** @type {string} */ id;
    /** @type {string} */ name;
    /** @type {connection} */ conn;
    /** @type {number[]} */ position;
    constructor(id, conn) {
        this.id = id;
        this.conn = conn;
    }
    sendMessage(data) {
        this.conn.sendUTF(JSON.stringify(data));
    }
    updatePosition(position) {
        this.position = position;
    }
}

class DataBaz {
    /** @type {Player[]} */ players = [];
    constructor() {
        setInterval(() => {
            this.broadcastPositions();
        }, 50);
    }
    addPlayer(player) {
        this.players.push(player);
    }
    removePlayer(player) {
        this.players = this.players.filter(p => p.id !== player.id);
    }
    broadcast(data, except = null) {
        this.players.filter(p => p !== except).forEach(player => {
            player.sendMessage(data);
        });
    }
    broadcastJoin(player) {
        this.broadcast({
            type: "player",
            event: "add",
            data: {
                id: player.id,
                name: player.name,
                position: player.position
            }
        }, player);
    }
    broadcastLeave(player) {
        this.broadcast({
            type: "player",
            event: "remove",
            data: {
                id: player.id
            }
        }, player);
    }
    broadcastMessage(player, message) {
        this.broadcast({
            type: "chat",
            data: {
                id: player.id,
                name: player.name,
                message: message
            }
        });
    }
    broadcastPositions() {
        this.players.forEach(player => {
            player.sendMessage({
                type: "player-bc",
                event: "update",
                data: this.players.map(p => ({id: p.id, position: p.position})).filter(p => p.id !== player.id)
            });
        });
    }
}


module.exports = { Player, DataBaz };
const WebSocket = require('ws');
const PORT = 8080; // Port for the bootstrap server

const peers = []; // List to keep track of connected peers

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('New peer connected to bootstrap server');
    
    // When a peer connects, send the list of known peers
    ws.send(JSON.stringify({ type: 'peerList', peers: peers.map(peer => peer.url) }));

    // Register the new peer
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'register') {
            console.log(`Registering new peer: ${data.url}`);
            peers.push({ url: data.url, ws: ws });
            // Notify existing peers about the new peer
            peers.forEach(peer => {
                if (peer.ws !== ws) {
                    peer.ws.send(JSON.stringify({ type: 'newPeer', url: data.url }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Peer disconnected from bootstrap server');
        // Remove disconnected peer from the list
        peers = peers.filter(peer => peer.ws !== ws);
    });
});

console.log(`Bootstrap server is running on port ${PORT}`);

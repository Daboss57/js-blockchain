const crypto = require('crypto');
const fs = require('fs');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});

fs.writeFileSync('publicKey.pem', publicKey.export({ type: 'spki', format: 'pem' }));
fs.writeFileSync('privateKey.pem', privateKey.export({ type: 'pkcs8', format: 'pem' }));

console.log('Keys have been generated and saved to publicKey.pem and privateKey.pem.');

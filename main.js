const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');

const TARGET_BLOCK_TIME = 10000; // Target time in milliseconds (e.g., 10 seconds)
const ADJUSTMENT_INTERVAL = 10; // Number of blocks to consider for difficulty adjustment

const bootstrapServerUrl = 'ws://localhost:8080';



const privateKey = fs.readFileSync('privateKey.pem', 'utf8');
const publicKey = fs.readFileSync('publicKey.pem', 'utf8');

const transactionData = JSON.stringify({
  fromAddress: this.fromAddress,
  toAddress: this.toAddress,
  amount: this.amount
});

function connectToBootstrapServer() {
  const ws = new WebSocket(bootstrapServerUrl);

  ws.on('open', () => {
      console.log('Connected to bootstrap server');
      ws.send(JSON.stringify({ type: 'register', url: `ws://localhost:${p2pPort}` }));
  });

  ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.type === 'peerList') {
          data.peers.forEach(peerUrl => {
              if (!peers.includes(peerUrl)) {
                  peers.push(peerUrl);
                  connectToPeer(peerUrl); // Connect to new peers
              }
          });
      } else if (data.type === 'newPeer') {
          if (!peers.includes(data.url)) {
              peers.push(data.url);
              connectToPeer(data.url); // Connect to new peers
          }
      }
  });
}

function connectToPeer(peerUrl) {
  const ws = new WebSocket(peerUrl);

  ws.on('open', () => {
      console.log(`Connected to peer: ${peerUrl}`);
  });

  ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.type === 'newBlock') {
          console.log('Received new block from peer:', data.block);
          blockchain.addBlock(data.block);
      }
  });
}



class Block {
  constructor(index, timestamp, transactions, previousHash = '') {
      this.index = index;
      this.timestamp = timestamp;
      this.transactions = transactions;
      this.previousHash = previousHash;
      this.hash = this.calculateHash();
      this.nonce = 0;
  }

  calculateHash() {
      return crypto.createHash('sha256')
          .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
          .digest('hex');
  }

  mineBlock(difficulty) {
      while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
          this.nonce++;
          this.hash = this.calculateHash();
      }
      console.log("Block mined: " + this.hash);
  }
}


class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 5;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.blockGenerationTime = [];
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2023", [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    minePendingTransactions(miningRewardAddress) {
        // Add a reward transaction before mining the block
        const rewardTransaction = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTransaction);

        let block = new Block(this.chain.length, new Date().toISOString(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log("Block successfully mined!");
        this.chain.push(block);

        // Clear pending transactions after mining
        this.pendingTransactions = [];

        if (this.chain.length > 1) {
            const timeTaken = new Date().getTime() - new Date(this.getLatestBlock().timestamp).getTime();
            this.blockGenerationTime.push(timeTaken);

            if (this.blockGenerationTime.length >= ADJUSTMENT_INTERVAL) {
                this.adjustDifficulty();
                this.blockGenerationTime = [];
            }
        }
    }

    adjustDifficulty() {
        const averageTime = this.blockGenerationTime.reduce((sum, time) => sum + time, 0) / this.blockGenerationTime.length;

        if (averageTime < TARGET_BLOCK_TIME) {
            this.difficulty++;
        } else if (averageTime > TARGET_BLOCK_TIME) {
            this.difficulty--;
        }

        console.log(`New difficulty: ${this.difficulty}`);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const tx of block.transactions) {
                if (tx.fromAddress === address) {
                    balance -= tx.amount;
                }

                if (tx.toAddress === address) {
                    balance += tx.amount;
                }
            }
        }

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}

class Transaction {
  constructor(fromAddress, toAddress, amount) {
      this.fromAddress = fromAddress;
      this.toAddress = toAddress;
      this.amount = amount;
      this.signature = null; // This will hold the digital signature
  }

  signTransaction() {
      if (this.fromAddress === null) {
          throw new Error('No from address provided.');
      }
      const sign = crypto.createSign('SHA256');
      const transactionData = JSON.stringify({
          fromAddress: this.fromAddress,
          toAddress: this.toAddress,
          amount: this.amount
      });
      sign.update(transactionData);
      this.signature = sign.sign(privateKey, 'hex');
  }

  verifySignature() {
      if (!this.signature) {
          return false;
      }
      const verify = crypto.createVerify('SHA256');
      const transactionData = JSON.stringify({
          fromAddress: this.fromAddress,
          toAddress: this.toAddress,
          amount: this.amount
      });
      verify.update(transactionData);
      return verify.verify(publicKey, this.signature, 'hex');
  }
}




const p2pPort = process.env.P2P_PORT || 6001;
const peers = process.env.PEERS ? process.env.PEERS.split(',') : [];

const wss = new WebSocket.Server({ port: p2pPort });

const blockchain = new Blockchain();

let connectedPeers = [];

wss.on('connection', (ws) => {
  connectedPeers.push(ws);
  console.log(`New peer connected on port ${p2pPort}`);

  ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.type === 'transaction') {
          const transaction = new Transaction(data.fromAddress, data.toAddress, data.amount);
          transaction.signature = data.signature;

          console.log('Transaction received');
          console.log('Transaction Data:', JSON.stringify(transaction));
          console.log('Signature:', transaction.signature);

          try {
              blockchain.addTransaction(transaction);
              ws.send(JSON.stringify({ type: 'transactionStatus', status: 'Transaction added to pending transactions' }));
          } catch (e) {
              ws.send(JSON.stringify({ type: 'transactionStatus', status: 'Transaction failed: ' + e.message }));
          }
      } else if (data.type === 'mineBlock') {
          console.log('Mining block as requested');
          blockchain.minePendingTransactions(data.miningRewardAddress);
          broadcastNewBlock(blockchain.getLatestBlock());
      } else if (data.type === 'viewBlockchain') {
          ws.send(JSON.stringify({ type: 'blockchain', chain: blockchain.chain }));
      } else if (data.type === 'viewBalance') {
          const balance = blockchain.getBalanceOfAddress(data.address);
          ws.send(JSON.stringify({ type: 'balance', address: data.address, balance: balance }));
      } else if (data.type === 'newBlock') {
          console.log('Received new block from peer:', data.block);
          blockchain.addBlock(data.block);
      }
  });

  ws.on('close', () => {
      connectedPeers = connectedPeers.filter(peer => peer !== ws);
  });
});


function broadcastNewBlock(newBlock) {
  connectedPeers.forEach(peer => {
      peer.send(JSON.stringify({
          type: 'newBlock',
          block: newBlock
      }));
  });
}

connectToBootstrapServer();

/*
peers.forEach(peer => {
    const ws = new WebSocket(peer);

    ws.on('open', () => {
        console.log(`Connected to peer: ${peer}`);
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'newBlock') {
            console.log('Received new block from peer:', data.block);
            blockchain.addBlock(data.block);
        }
    });
});
*/

console.log(`Listening for P2P connections on port: ${p2pPort}`);

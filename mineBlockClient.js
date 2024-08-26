const WebSocket = require('ws');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ws = new WebSocket('ws://localhost:6001');  // Connect to your server

ws.on('open', () => {
    console.log('Connected to the blockchain node.');
    promptUser();
});

ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'transactionStatus') {
        console.log('Transaction Status:', data.status);
    } else if (data.type === 'blockchain') {
        console.log('Blockchain:', JSON.stringify(data.chain, null, 2));
    } else if (data.type === 'balance') {
        console.log(`Balance of address ${data.address}: ${data.balance}`);
    } else if (data.type === 'newBlock') {
        console.log('New block mined:', data.block);
    }
    promptUser();
});

function promptUser() {
    rl.question('Enter a command (transaction/mine/view): ', (command) => {
        switch (command) {
            case 'transaction':
                handleTransaction();
                break;
            case 'mine':
                handleMine();
                break;
            case 'view':
                handleView();
                break;
            default:
                console.log('Unknown command');
                promptUser();
        }
    });
}

function handleTransaction() {
    rl.question('Enter from address: ', (fromAddress) => {
        rl.question('Enter to address: ', (toAddress) => {
            rl.question('Enter amount: ', (amount) => {
                const transaction = {
                    type: 'transaction',
                    fromAddress: fromAddress,
                    toAddress: toAddress,
                    amount: parseFloat(amount)
                };
                ws.send(JSON.stringify(transaction));
                console.log('Transaction sent');
                promptUser();
            });
        });
    });
}

function handleMine() {
    rl.question('Enter your address to receive mining reward: ', (address) => {
        const mineCommand = {
            type: 'mineBlock',
            miningRewardAddress: address
        };
        ws.send(JSON.stringify(mineCommand));
        console.log('Mining command sent');
        promptUser();
    });
}

function handleView() {
    const viewCommand = {
        type: 'viewBlockchain'
    };
    ws.send(JSON.stringify(viewCommand));
    console.log('Requesting full blockchain...');
    
    setTimeout(() => {
        rl.question('Enter address to view balance: ', (address) => {
            const balanceRequest = {
                type: 'viewBalance',
                address: address
            };
            ws.send(JSON.stringify(balanceRequest));
        });
    }, 1000);
}

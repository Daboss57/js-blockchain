const WebSocket = require('ws');
const readline = require('readline');
const crypto = require('crypto');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const privateKey = fs.readFileSync('privateKey.pem', 'utf8');

const ws = new WebSocket('ws://localhost:6001');

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
    rl.question('Enter a command (transaction/mine/view/balance/donate-to-charity): ', (command) => {
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
            case 'balance':
                handleBalance();
                break;
            case 'donate-to-charity':
                handleCharity();
                break;
            default:
                console.log('Unknown command');
                promptUser();
        }
    });
}

function handleBalance() {
    rl.question('Enter address to view balance: ', (address) => {
        const balanceRequest = {
            type: 'viewBalance',
            address: address
        };
        ws.send(JSON.stringify(balanceRequest));
        console.log('Requesting balance for address:', address);
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
                    amount: parseFloat(amount),
                };

                // Sign the transaction
                const sign = crypto.createSign('SHA256');
                const transactionData = JSON.stringify({
                    fromAddress: fromAddress,
                    toAddress: toAddress,
                    amount: parseFloat(amount)
                });
                sign.update(transactionData);
                const signature = sign.sign(privateKey, 'hex');

                // Include the signature in the transaction
                transaction.signature = signature;

                console.log('Transaction Data:', transactionData);
                console.log('Signature:', signature);

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

function handleCharity() {
    rl.question('Enter from address: ', (fromAddress) => {
        let coolNumber = crypto.randomInt(1,1000000001);

        const toAddress = "completelyValidCharityAddress";
        const transaction = {
            type: 'transaction',
            fromAddress: fromAddress,
            toAddress: toAddress,
            amount: parseFloat(coolNumber),
        };

        // Sign the transaction
        const sign = crypto.createSign('SHA256');
        const transactionData = JSON.stringify({
            fromAddress: fromAddress,
            toAddress: toAddress,
            amount: parseFloat(coolNumber)
        });
        sign.update(transactionData);
        const signature = sign.sign(privateKey, 'hex');

        // Include the signature in the transaction
        transaction.signature = signature;

        console.log('Transaction Data:', transactionData);
        console.log('Signature:', signature);

        ws.send(JSON.stringify(transaction));

        // console.log(`You donated $${coolNumber} to charity`);
        console.log('You donated $',coolNumber, 'to charity!');
    });

    promptUser();
}

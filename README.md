# JavaScript Blockchain Concept

To use this in terminal make sure you have Node.js installed.
Make sure to run the following command:

**Install Dependencies**
   Open your terminal and run:
   ``npm install crypto ws readline``

Before running the blockchain, you need RSA key pairs for signing transactions. Run the following command to generate and save the keys:
``node generateKeys.js``
This will generate two files: `privateKey.pem` and `publicKey.pem` in the same directory.
You can use these keys to sign transactions and verify signatures.

Before starting anything else, you will need to start the bootstrap server with:
``node bootstrapServer.js``
This will start the bootstrap server on port 8080, which helps nodes discover each other.

Now, open this in terminal (preferably the IDE's terminal). I used VSC so this is how I did it:

1. Download all the files and open in VSC
2. Open terminal and type ``$env:P2P_PORT="6001"``
3. Run ``node main.js``
4. Now it should say, ``Listening for P2P connections on port: 6001``
5. Now open up a second terminal (Ctrl+Shift+`)
6. Run the following: ``$env:P2P_PORT="6002"`` then ``$env:PEERS="ws://localhost:6001"``
7. Finally, you can run ``node mineBlockClient.js``

Congratulations! If you ran everything correctly it should be connected to your server terminal. I'm going to leave it up to you to explore with transactions, addresses, and mining. Have fun! :D

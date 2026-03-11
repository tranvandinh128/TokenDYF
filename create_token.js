const StellarSDK = require("@stellar/stellar-sdk");

const server = new StellarSDK.Horizon.Server("https://api.testnet.minepi.com");
const NETWORK_PASSPHRASE = "Pi Testnet";

// Thay bằng SECRET KEY thật của bạn
const issuerSecret = "SDLEUSKWPBIYRMAQOHDNI7FOVRUJ2IGWGX7J64FQJ2DF3EUUP4SOZDZW
";
const distributorSecret = "SCO7TFHW2ITK4JM3ARQBXLKIANIIWCKGHQ5WWIZTCAW27ZPENGSWYM4E
";

const issuerKeypair = StellarSDK.Keypair.fromSecret(issuerSecret);
const distributorKeypair = StellarSDK.Keypair.fromSecret(distributorSecret);

// Token DYF
const customToken = new StellarSDK.Asset(
  "DYF",
  issuerKeypair.publicKey()
);

async function run() {

  console.log("Creating trustline...");

  const distributorAccount = await server.loadAccount(
    distributorKeypair.publicKey()
  );

  const fee = await server.fetchBaseFee();

  const trustTransaction = new StellarSDK.TransactionBuilder(distributorAccount, {
    fee: fee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSDK.Operation.changeTrust({
        asset: customToken
      })
    )
    .setTimeout(100)
    .build();

  trustTransaction.sign(distributorKeypair);

  await server.submitTransaction(trustTransaction);

  console.log("Trustline created successfully");

  // Issuer gửi token
  console.log("Issuing DYF token...");

  const issuerAccount = await server.loadAccount(
    issuerKeypair.publicKey()
  );

  const paymentTransaction = new StellarSDK.TransactionBuilder(issuerAccount, {
    fee: fee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSDK.Operation.payment({
        destination: distributorKeypair.publicKey(),
        asset: customToken,
        amount: "1000000"
      })
    )
    .setTimeout(100)
    .build();

  paymentTransaction.sign(issuerKeypair);

  await server.submitTransaction(paymentTransaction);

  console.log("DYF Token issued successfully!");

  const account = await server.loadAccount(distributorKeypair.publicKey());

  console.log("Distributor balances:");

  account.balances.forEach((balance) => {
    if (balance.asset_type === "native") {
      console.log("Pi:", balance.balance);
    } else {
      console.log(balance.asset_code + ":", balance.balance);
    }
  });

}

run();

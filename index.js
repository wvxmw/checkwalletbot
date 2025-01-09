const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
const timestampToDate = require("timestamp-to-date");
require("dotenv").config();
const bot = new Telegraf(process.env.BOT_TOKEN);

const contract_address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const mainChatId = "-1002253121294";
const mainWallet = {
   address: "TNFm9JdGoj58wnkos742obF8mN4Xcm5n6X",
   deposit: {
      id: "",
      timeStamp: "",
      infoText: "эйфории",
      subFile: "subscribers.json",
      minAmount: 1000,
      showFrom: false,
   },
   out: {
      id: "",
      timeStamp: "",
      infoText: "",
      subFile: "",
   },
   signs: "🔴🔴🔴🔴🔴",
};

(async () => {
   while (true) {
      await checkDeposit(mainWallet);
      // console.log("----------------------------------------------------------");
   }
})();

bot.on("message", async (ctx) => {
   if (!ctx.message.text) return;
});
bot.launch();

function editedValue(value, decimalPlaces = 0) {
   return (value / 1000000).toFixed(decimalPlaces);
}

async function checkDeposit(wallet) {
   // console.log(
   //    `Последнее ID пополнения ${wallet.deposit.infoText} ${wallet.deposit.id}`
   // );
   // console.log(
   //    `Последнее время пополнения ${wallet.deposit.infoText} ${
   //       wallet.deposit.timeStamp &&
   //       timestampToDate(wallet.deposit.timeStamp, "dd.MM.yyyy HH:mm:ss")
   //    }`
   // );

   await fetch(
      `https://api.trongrid.io/v1/accounts/${wallet.address}/transactions/trc20?limit=20&contract_address=${contract_address}&min_timestamp=${wallet.deposit.timeStamp}&only_to=true`
   )
      .then((response) => response.json())
      .then(async (data) => {
         const transfers = data.data;
         if (wallet.deposit.id !== "" && transfers.length > 0) {
            if (wallet.deposit.id !== transfers[0].transaction_id) {
               let maxI = transfers.length - 1;
               for (let i = 0; i < transfers.length; i++) {
                  if (transfers[i].transaction_id === wallet.deposit.id) {
                     maxI = i - 1;
                  }
               }
               for (let i = maxI; i >= 0; i--) {
                  if (transfers[i].transaction_id !== wallet.deposit.id) {
                     const transferAmount = editedValue(transfers[i].value);
                     if (transferAmount >= wallet.deposit.minAmount) {
                        await bot.telegram.sendMessage(
                           mainChatId,
                           `${wallet.signs && wallet.signs + "\n"}Пополнение ${
                              wallet.deposit.infoText
                           }\nСумма: ${stringValue(
                              transferAmount
                           )} USDT\nВремя: ${timestampToDate(
                              transfers[i].block_timestamp,
                              "HH:mm:ss"
                           )}`
                        );
                     }
                  }
               }
               wallet.deposit.id = transfers[0].transaction_id;
               wallet.deposit.timeStamp = transfers[0].block_timestamp;
            }
         } else {
            if (transfers.length > 0) {
               wallet.deposit.id = transfers[0].transaction_id;
               wallet.deposit.timeStamp = transfers[0].block_timestamp;
            }
         }
         // if (transfers) {
         //    for (let i = 0; i < transfers.length; i++) {
         //       console.log(`${i + 1}. ${transfers[i].transaction_id}`);
         //    }
         // }
      })
      .catch((error) => console.error(error));
   // console.log(" ");
}

function stringValue(value) {
   return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

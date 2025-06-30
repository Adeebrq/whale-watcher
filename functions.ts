let cachedPrice: number | null = null;
let lastFetchedTime: number = 0;

const HELIUS= process.env.HELIUS_API_KEY;
const BIRDEYE= process.env.BIRDEYE_API_KEY!;


export function isMemecoin(token: string) {
  const stablecoins = [
    "So11111111111111111111111111111111111111112", // SOL wrapped
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERdhvjPYZ6zUM7XmoeR4eUuKXPX3uWzv1J", // USDT
  ];
  return !stablecoins.includes(token);
}

async function getTokenValue(ca:string){
  const res= await fetch(`https://public-api.birdeye.so/defi/price?address=${ca}`, {
    method: 'GET',
    headers:{
        'accept': 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': BIRDEYE,
    },
  })

  const data= await res.json()
  const pricePerToken= data?.data?.value
  return pricePerToken || 0
}


async function getTokenName(name: string){
  const res= await fetch(`https://rpc.helius.xyz/?api-key=${HELIUS}`,{
    method: "POST",
    headers:{
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": "1",
        "method": "getAsset",
        "params": [name]
  })
})
const data= await res.json()

const tokenName= data?.result?.content?.metadata?.name
const tokenSymbol= data?.result?.content?.metadata?.symbol || tokenName

const tokenSupply= data?.result?.token_info?.supply
const tokenDecimal= data?.result?.token_info?.decimals || 0
const readableSupply= tokenSupply / Math.pow(10, tokenDecimal)

console.log(readableSupply, tokenDecimal, tokenSupply)

return {tokenName, tokenSymbol, tokenSupply, tokenDecimal, readableSupply}
}

async function solPriceFetch(): Promise<number | null> {
  let now = Date.now();
  if (cachedPrice !== null && now - lastFetchedTime < 60_000) {
    return cachedPrice;
  }

  try {
    const solUsdFetch = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    if (!solUsdFetch.ok) {
      throw new Error("API call for sol price failed");
    }
    const solUsd = await solUsdFetch.json();
    if (solUsd?.solana?.usd) {
      cachedPrice = solUsd.solana.usd;
      lastFetchedTime = now;
    }
  } catch(error) {
    console.log("Coingecko API failed", error)
  }

  try {
    const solUsdFetch2 = await fetch(
      "https://api.dexpaprika.com/networks/solana/tokens/So11111111111111111111111111111111111111112"
    );
    if (!solUsdFetch2.ok) {
      throw new Error("2nd api failed");
    }
    const solUsd2 = await solUsdFetch2.json();
    if (solUsd2?.summary?.price_usd) {
      cachedPrice = solUsd2.summary.price_usd;
      lastFetchedTime = now;
    }
  } catch(error) {
    console.log("2nd api failed", error)

  }
  console.log(cachedPrice, "cachedPrice")
  return cachedPrice;
}


export async function extractBuys(transactions: any) {
    const buys = [];
    let solPrice = await solPriceFetch();
  
    for (const tx of transactions || []) {
      console.log("Processing transaction:", tx.signature);
      
      let solSpentBy = null;
      let solSpent = 0;
      let memecoinReceived = null;
  
      for (const acc of tx.accountData || []) {
        if (acc.nativeBalanceChange < 0) {
          console.log(`SOL spent by: ${acc.account}, amount: ${Math.abs(acc.nativeBalanceChange)}`);
          solSpentBy = acc.account;
          solSpent += Math.abs(acc.nativeBalanceChange);
        }
  
        for (const tokenChange of acc.tokenBalanceChanges || []) {
          console.log("Token change:", {
            mint: tokenChange.mint,
            tokenAmount: tokenChange.rawTokenAmount.tokenAmount,
            userAccount: tokenChange.userAccount,
            isMemecoin: isMemecoin(tokenChange.mint),
            isPositive: parseFloat(tokenChange.rawTokenAmount.tokenAmount) > 0
          });
  
          if (
            parseFloat(tokenChange.rawTokenAmount.tokenAmount) > 0 &&
            isMemecoin(tokenChange.mint)
          ) {
            console.log("Found memecoin received:", {
              user: tokenChange.userAccount,
              mint: tokenChange.mint
            });
            memecoinReceived = {
              user: tokenChange.userAccount,
              mint: tokenChange.mint,
            };
          }
        }
      }
  
      console.log("Final check:", {
        solSpentBy,
        memecoinReceived,
        match: solSpentBy && memecoinReceived && solSpentBy === memecoinReceived.user
      });
  
      if (
        solSpentBy &&
        memecoinReceived &&
        solSpentBy === memecoinReceived.user
      ) {
        const {tokenSymbol, readableSupply}= await getTokenName(memecoinReceived.mint)
        const pricePerToken= await getTokenValue(memecoinReceived.mint)
        const buy = {
          buyer: solSpentBy,
          mint: memecoinReceived.mint,
          tokenSymbol: tokenSymbol,
          solSpent: solSpent / 1e9,
          usdBalance: solPrice !== null ? (solSpent / 1e9) * solPrice : null,
          mrktCap: readableSupply * pricePerToken
        };
        console.log(buy.mrktCap)
        buys.push(buy);
      }
    }
    return buys;
  }
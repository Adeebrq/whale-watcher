let cachedPrice: number | null = null;
let lastFetchedTime: number = 0;

export function isMemecoin(token: string) {
  const stablecoins = [
    "So11111111111111111111111111111111111111112", // SOL wrapped
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERdhvjPYZ6zUM7XmoeR4eUuKXPX3uWzv1J", // USDT
  ];
  return !stablecoins.includes(token);
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
    let solSpentBy = null;
    let solSpent = 0;
    let memecoinReceived = null;

    for (const acc of tx.accountData || []) {
      if (acc.nativeBalanceChange < 0) {
        solSpentBy = acc.account;
        solSpent += Math.abs(acc.nativeBalanceChange);
      }

      for (const tokenChange of acc.tokenBalanceChanges || []) {
        if (
          parseFloat(tokenChange.rawTokenAmount.tokenAmount) > 0 &&
          isMemecoin(tokenChange.mint)
        ) {
          memecoinReceived = {
            user: tokenChange.userAccount,
            mint: tokenChange.mint,
          };
        }
      }
    }

    if (
      solSpentBy &&
      memecoinReceived &&
      solSpentBy === memecoinReceived.user
    ) {
      buys.push({
        buyer: solSpentBy,
        mint: memecoinReceived.mint,
        solSpent: solSpent / 1e9,
        usdBalance: solPrice !== null ? (solSpent / 1e9) * solPrice : null,
      });
    }
  }

  return buys;
}

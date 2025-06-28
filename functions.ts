
export function isMemecoin(token: string){
    const stablecoins=[
        "So11111111111111111111111111111111111111112", // SOL wrapped
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
        "Es9vMFrzaCERdhvjPYZ6zUM7XmoeR4eUuKXPX3uWzv1J"  // USDT
    ]
    return !stablecoins.includes(token)
}


export async function extractBuys(transactions : any){
    const buys=[]
    let solPrice= null

    try {
        const solUsdFetch= await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")

        if(!solUsdFetch.ok){
            throw new Error("API call for sol price failed")
        }

        const solUsd= await solUsdFetch.json()
        if(solUsd?.solana?.usd){
            solPrice= solUsd.solana.usd
        }
    } catch (error) {
        console.log("error fetching usd price",  error)
    }



    for (const tx of transactions ){
        let solSpentBy= null
        let solSpent = 0
        let memecoinReceived= null


        for (const acc of tx.accountData || []){

            if(acc.nativeBalanceChange < 0){
                solSpentBy = acc.account;
                solSpent += Math.abs(acc.nativeBalanceChange)
            }

            for (const tokenChange of acc.tokenBalanceChanges){
                if(
                    parseFloat(tokenChange.rawTokenAmount.tokenAmount) > 0 &&
                    isMemecoin(tokenChange.mint)
                ){
                    memecoinReceived={
                        user: tokenChange.userAccount,
                        mint: tokenChange.mint,
                    }
                }
            }
        }

        if(solSpentBy && memecoinReceived && solSpentBy === memecoinReceived.user){
            buys.push({
                buyer: solSpentBy,
                mint: memecoinReceived.mint,
                solSpent: solSpent /1e9,
                usdBalance: solPrice !== null ? (solSpent /1e9) * solPrice : null
            })
        }
    }

    return buys;
}
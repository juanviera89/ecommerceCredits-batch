const rfr = require('rfr');
const models = rfr('db/models').models;

const validateTransaction = (transaction) => {
    try {
        const keyErrors = ['correo', 'tienda', 'monto'].reduce((error, key) => {
            return !Object.keys(transaction).includes(key) || error
        }, false)
        if (keyErrors) return false;
        if (isNaN(Number(transaction.monto))) return false;
        if (`${transaction.correo}`.trim().length && `${transaction.tienda}`.trim().length) return true
        return false
    } catch (error) {
        console.log(`Transaction validation error ${transaction}`);
        console.error(error);
        return false
    }
}

const validateClientStore = async (transaction) => {
    try {
        const client = transaction.correo, store = transaction.tienda
        const foundStore = await models.client.findOne({ where: { email: client }, include: { model: models.store, where: { name: store } } });
        if (foundStore && foundStore.stores && foundStore.stores[0]) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(`Transaction validation error ${transaction}`);
        console.error(error);
        return false
    }
}

const reduceTransactions = (transactions = []) => {
    return transactions.reduce((resArr, transaction) => {
        if (!validateTransaction(transaction)) {
            console.log(`unespected transaction format ${JSON.stringify(transaction)}`);
            console.log('Transaction skipped');
            return resArr
        }
        const n = resArr.findIndex((t) => t.tienda == transaction.tienda && t.correo == transaction.correo);
        const tempTransaction = {
            correo: transaction.correo,
            tienda: transaction.tienda,
            monto: transaction.monto
        };
        if (n >= 0) {
            const tempArr = [...resArr];
            tempArr[n].monto += tempTransaction.monto;
            return tempArr
        } else {
            return [...resArr, tempTransaction];
        }
    }, [])
}

const processTransactions = async (transactions = []) => {
    let n = 0
    for (const transaction of transactions) {
        try {
            if (! ( await validateClientStore(transaction))) {
                console.log(`Client-Store combination not found ${JSON.stringify(transaction)}`);
                console.log('Transaction skipped');
                continue
            }
            const client = transaction.correo, store = transaction.tienda, amount = transaction.monto;
            const foundCredits = await models.store.findOne({ where: { name: store }, include: { model: models.credit, attributes: ['credits', 'id'] } });
            if (!foundCredits || !foundCredits.credit) {
                console.log(`Store without credit information ${JSON.stringify(transaction)}`);
                console.log('Transaction skipped');
                continue;
            }
            const credits = Number(((foundCredits || {}).credit || {}).credits) + Math.round(amount);
            if (credits < 0) {
                console.log(`Transaction couldn't be processed ${JSON.stringify(transaction)}, Inssuficient funds in store`);
                continue;
            }
            const update = await models.credit.update({ credits }, { where: { id: foundCredits.credit.id } })
            if (!(update && update[0])) {
                console.log(`Transaction couldn't be applied ${JSON.stringify(transaction)}`);
                continue;
            }
            n++;
        } catch (error) {
            console.log(`Transaction error ${transaction}`);
            console.error(error);
            continue
        }
    }
    console.log(`${n} Transactions where aplied from ${transactions.length} transactions processed`);
}

module.exports = { validateTransaction, validateClientStore, reduceTransactions, processTransactions }
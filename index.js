const AWS = require('aws-sdk');
const util = require('util');
const xlsx = require('xlsx');
const { validateTransaction, validateClientStore, reduceTransactions, processTransactions } = require('./components/transactions');

// get reference to S3 client
const s3 = new AWS.S3();



exports.handler = async (event, context, callback) => {
    // Read options from the event parameter.
    console.log("Reading options from event:\n", util.inspect(event, { depth: 5 }));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    console.log(srcBucket, srcKey, typeMatch);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }

    // Check that the image type is supported  
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "csv") {
        console.log(`Unsupported image type: ${imageType}`);
        return;
    }

    // Download the csv from the S3 source bucket. 
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        var csvFile = await s3.getObject(params).promise();
        console.log(`${srcKey} loaded`);
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        console.log('Parsing file');
        const workbook = xlsx.read(csvFile.Body, { type: "buffer" });
        console.log(workbook);
        const firstSheet = Object.keys(workbook.Sheets)[0]
        var transactions = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet])
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        console.log('====================================');
        console.log('Connecting to DB')
        const db = require('./db');
        await db.authenticate()
        require('./db/models').initModels(db);
        await db.sync();
        console.log('Connected')
        console.log('====================================')
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        console.log(`Processing ${transactions.length} transactions`);
        const resumedTransactions = reduceTransactions(transactions);
        await processTransactions(resumedTransactions);
    } catch (error) {
        console.log(error);
        return;
    }

    console.log('Successfully loaded ' + srcBucket + '/' + srcKey);
};
# ecommerceCredits-batch

   Author: Juan Viera
   Country: Chile
   Region/County/State: Region Metropolitana
   Contact: juanviera89@gmail.com
   
## Project Description

MVP Batch processing service for AWS lambda function

## Platforms

   1. -Node Js@12

## Requirements

   1. -sequelize  @6
   2. -aws-sdk @2
   3. -xlsx @0.16
   4. -pg @8

## Porject Folder Structure
``` 
root
|__ index.js : Main script 
|__ components : Components for data processing - Microservices arquitecture type components
|   |__ component : 
|       |__ index : functions for event handling
|__ config : configuration files repositorie ~ More about configuration @ [github](https://github.com/lorenwest/node-config/wiki) and [npmjs](https://www.npmjs.com/package/config)
|__ db : database connection handler ~ more info about sequelize @ [sequelize](https://sequelize.org/master/ https://www.npmjs.com/package/sequelize)
|   |__ models : sequelize models schemas. 
|__ index.js: Main event handling script to be excecuted on S3 event trigger 
```

## Configurations

   All configuration variables are disposed in a centralized files in  folder  **(./config)** , separated for each deployment and/or development enviroment. To define the enviroment, enviroment variable NODE_ENV must be set; if not set, "./.env" would be readed and NODE_ENV would get the value specified in that file (Only if dev dependencies are installed). Patterns to setup configuration files are descrbibe at [default example](./config/default.json.example) and [enviroment example](./config/enviroment.json.example)

   To get a config in the App, import config, and library will automatically load files related to actual enviroment specified by NODE_ENV

   for more information about config visit:
   1. [github](https://github.com/lorenwest/node-config/wiki)
   2. [npmjs](https://www.npmjs.com/package/config)

### Example of use:

   getting DB host:
   `config.get('db.host')`

   
## Automated Tests

  Tests are made with mocha and assert library chai. In this project, test are splitted by components and routes (server) and each test command is specified at command point in this document.
  
   1. [mocha-npmjs](https://www.npmjs.com/package/mocha)
   2. [chai-npmjs](https://www.npmjs.com/package/chai)
  
  In order to ensure that everything stills running after changes were made, test must pass.

  If any component runs logical operations more than querying and compare, test should be made at those operations, refactoring is recommended.

  All routes must have test.

  To create a test file, name it with the format *.test.js

  
## Deployment
Deployment is made with AWS Lambda Function.
In order to update lambda function, zip project folder (including dependencies) and excecute the command:
aws lambda update-function-code --function-name FUNCTIONNAME --zip-file fileb://FILENAME.zip 

If deploying into a new function, zip as previous step, and  excecute the command:
aws lambda create-function --function-name FUNCTIONNAME --zip-file fileb://FILENAME.zip --handler index.handler --runtime nodejs12.x --timeout 100 --memory-size 10240 --role arn:aws:iam::AccountID:role/lambda-s3-role --region S3REGION

S3 trigger should be configured after first deployment of Lambda function, in order to associate Trigger event to handler function

[nodejs-lambda-deployment](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html)
[s3-lambdaFx-tutorial](https://docs.aws.amazon.com/en_en/lambda/latest/dg/with-s3-example.html)
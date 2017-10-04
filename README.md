# sentimental-sam

A tool that allows users to schedule questions to be asked through slack.

## Architecture comments:

There are two components the website ./sam-question-site using react and deployed through aws s3 while the rest of the application is in aws lambda functions.

The overall flow is as follows:
* User adds questions from sam-question-site web interface
* questions are added to AWS SQS queue (kept in queue for 14 days)
* either the ./module/execute-site-questions or ./module/execute-offschedule-questions is executed (with a cron)
* Messages are read from the queue and posted to slack
* Slack responses flow through the ./endpoints/intermediate-handler (determines which function to call) then ./modules/handle-response and responses and generated and saved in the relative s3 bucket.
* A seperate cron job runs ./modules/generate-report-site-questions which post results to slack general.

## Deployment:
Install all dependencies:
```
//From root of project
npm install && cd ./endpoints && npm install && cd ../modules && npm install && cd ../
```

Ensure you have your aws environment variables of AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY set-up. See: https://serverless.com/framework/docs/providers/aws/guide/credentials/

Serverless currently doesn't allow full control of the contents of the zip file so there have been some hacks and duplications inside the various serverless.yml files. (opportunity to write a plugin)

Currently there are 2 directories containing all the lambda details
./endpoints (contains all functions exposed through an api gateway endpoint)
./modules (contains all other helper functions)

For each just run the following in each directory to deploy (note only prod exists as of writing this)
```
serverless deploy --stage prod
```

To deploy a single function simply:
```
serverless deploy --stage prod --functionName <desired function>
```

## Report generation
Reports are generated using the google charts api by hackily constructing a url to display in slack. This deprecated api was used as it allows for a simple still .png get endpoint to be created. 

https://developers.google.com/chart/image/

```
Note this is a deprecated feature however is still available.
```


## Slack configuration

To manage the 3 second response time requirement set by slack there is a intermediate handler that will invoke the corresponding function and send the callback. This is listed in ./modules/intermediate-handler/ . Please note there still exists the tech debt to set another version of this depending on the environment deployed under. The endpoint configured here will be used as the webhook callback for the slack application.

For details and tutorials see: https://api.slack.com/slack-apps
```
Make sure you deploy the app and the secrets are correctly set across the the various modules
```

## Secret management:

So is quite overkill however secrets are firstly encrypted with the aws kms 

```
aws kms encrypt --key-id <awsKmsKeyArn> --plaintext "super secret key here"
```

then added to your 'secrets.<environment>.yml' file. 

Afterwards just encrypt using the serverless  (docs: https://github.com/serverless/examples/tree/master/aws-node-env-variables-encrypted-in-a-file)
```
serverless encrypt --stage prod --password '<wifi password currently ;)>'
```

## Front-end interface

After building a prod version upload the files in ./sam-question-site/dist to an s3 bucket and enable hosting.
```
cd sam-question-site && npm run build:prod
```

### Generalizing for other slack teams / platforms

Currently there is a sign in with slack option. To generalize this for multiple slack teams there are currently a few tech debt items and considerations to address first.
* Dynamically create SQS queues
* Ensure bucket name generation (and deletion) is sound
* Change jwt secret key based on team (currently there is only 1 jwt secret generation key)
* Ensure dynamically set function name calls in ./endpoints/intermediate-handler

### Route management

Routes are currently hard coded into ./sam-question-site/components/common.js these values are what are generated from the serverless api gateway deployments inside the ./endpoints folder
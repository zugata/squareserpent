This directory supports running SquareSerpent on AWS Lambda.

## Prerequisites

[yarn](https://yarnpkg.com/) is preferred over `npm`. It's recommended to install and use that.

## Running in development

Install SAM Local as described [here](https://docs.aws.amazon.com/lambda/latest/dg/sam-cli-requirements.html).

First, run the following in the project root (up one level from here):

    $ yarn watch-lambda

This will watch source files in `src/` and recompile changed files automatically.

Then run the following in this directory (`lambda/`). Currently, you have to provide a Mandrill API key as the SMTP password in the environment:

    $ SQUARESERPENT_SMTP_PASSWORD="..." sam local invoke SendEmail -e test-invoke-payload.json

If you aren't already using the AWS CLI, you'll most likely need to provide AWS credentials to SAM Local. You can pass them in the environment like so:

    $ AWS_ACCESS_KEY_ID="..." AWS_SECRET_ACCESS_KEY="..." SQUARESERPENT_SMTP_PASSWORD="..." \
        sam local invoke SendEmail -e test-invoke-payload.json

This will invoke the Lambda function in `send-email.js` with the payload in `test-invoke-payload.json`. The payload in that file can be tweaked as necessary to suit your needs.

## Deployment

Currently the code is deployed manually to Lambda by uploading a zip file in the Lambda management console. To build, run the following in the project root (up one level from here)

    $ yarn build-lambda

This will generate a `lambda.zip` file in the project root that can be uploaded to Lambda. After uploading the code, the lambda function should set `send-email.handler` as the handler.

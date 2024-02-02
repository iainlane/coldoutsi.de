# Contributing to coldoutsi.de

Firstly, thank you for considering contributing to `coldoutsi.de`! 🎉 We
appreciate your time and effort, and value every contribution, no matter how
small.

The main rules are: be nice, and be patient. Always assume good faith.

## Tech Stack

The project is a serverless application, written with TypeScript and managed
with npm and yarn. It is designed to run on AWS Lambda and uses DynamoDB to
cache results from the remote APIs we query. [middy] is used to handle the
middleware for the Lambda functions, and [serverless] is used to manage the
deployment of the application.

The API gateway is behind a CloudFront stack. We set cache-control headers to
ensure that responses are cached for a reasonable amount of time.

Testing is done with [Jest][jest], with
[`jest-mock-extended`][jest-mock-extended] to provide mocks where we need them.

[jest]: https://jestjs.io/
[jest-mock-extended]: https://www.npmjs.com/package/jest-mock-extended
[middy]: https://middy.js.org/
[serverless]: https://www.serverless.com/

## Setting Up Your Development Environment

We recommend using our devcontainer to get started quickly and run in exactly
the same environment as everyone else. This requires a container manager such as
[Podman][podman] or [Docker][docker], and [Visual Studio Code][vscode] with the
[Remote - Containers][remote-containers] extension installed or any other
environment which supports [dev containers][devcontainers].

1. Clone the repository:

```sh
git clone https://github.com/iainlane/coldoutsi.de.git
```

2. Open the project in the IDE

3. If using VS Code, click "Reopen in Container" when prompted. This will build
   and start the container with all the necessary dependencies installed.

[devcontainers]: https://containers.dev/
[docker]: https://www.docker.com/
[podman]: https://podman.io/
[remote-containers]:
  https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers
[vscode]: https://code.visualstudio.com/

## Running the Application

You will need to set up your AWS credentials to run the application. The dev
container will mount your `~/.aws` directory into the container, so you can use
the same credentials as you would on your host machine.

The profile and region to use are specified in `serverless.yml`.

Verify this works by looking at the output of `aws sts get-caller-identity`:

```console
$ AWS_PROFILE=your-profile AWS_REGION=your-region aws sts get-caller-identity
{
    "UserId": "me",
    "Account": "012345678901",
    "Arn": "arn:aws:sts::012345678901:assumed-role/AWSReservedSSO_SomeRoleName_0123456789abcdef/me"
}
```

To run the application locally, we use
[`serverless-offline`][serverless-offline]. Use the following command:

```sh
serverless offline --stage local
```

And then access the handlers at `http://localhost:3000/<handler>`.

[serverless-offline]: https://www.serverless.com/plugins/serverless-offline

## Running Tests

To run tests, use the following command:

```sh
yarn test
```

This will run the tests and generate a coverage report.

Alternatively, we recommend using the [Jest extension for Visual Studio
Code][vscode-jest] to run tests automatically.

[vscode-jest]:
  https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest

## Deploying

The application supports being deployed to a custom domain. This is expected to
already be available in Route 53 in your AWS account.

Unless you're deploying to `coldoutsi.de` itself, edit the domain names in
`custom.domains` in `serverless.yml` to match your domain.

To deploy the application, use the following command:

```sh
yarn serverless deploy --stage dev # or production
```

This should deploy the AWS resources and make the application available at your
domain.

## Contributing Code

If your contribution is non-trivial, it might be a good idea to open an issue
first to discuss the changes you would like to make. This will help us to avoid
wasting time on changes that might not be accepted.

Before submitting a pull request, please ensure your code adheres to our coding
standards (as defined in `.eslintrc.json` and `.prettierrc`) and all tests pass.
All code must be covered by tests.

Thank you again for your contribution!

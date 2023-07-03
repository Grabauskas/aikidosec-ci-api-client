# aikido-cli

<!-- [![NPM Version](http://img.shields.io/npm/v/aikido-cli.svg?style=flat)](https://www.npmjs.org/package/aikido-cli)
[![NPM Downloads](https://img.shields.io/npm/dm/aikido-cli.svg?style=flat)](https://npmcharts.com/compare/aikido-cli?minimal=true)
[![Install Size](https://packagephobia.now.sh/badge?p=aikido-cli)](https://packagephobia.now.sh/result?p=aikido-cli) -->

CLI helper for the public [Aikido CI API](https://aikido-dev.notion.site/aikido-dev/Aikido-CI-API-78d318b5f5f7477ab072e12f94b21374). This cli tool can help integrate Aikido into a custom CI pipeline without having to implement the Aikido CI API yourself.

## Installation and setup

The quickest way to get started is to install the cli tool as a global package.

```sh
# npm users
$ npm install -g aikido-cli

# yarn users
$ yarn global add aikido-cli
```

After installation, you'll need to setup your Aikido API key. You can add your key by requesting a token on the [Continuous Integrations page](https://app.aikido.dev/settings/integrations/continuous-integration) in the [Integrations](https://app.aikido.dev/settings/integrations) section of the Aikido web platform. Click the "Start integrating" link and setup your key globally by executing

```sh
$ aikido-cli apikey <your-api-key-here>
```

⚠️ Your Aikido API key is stored in `~/.config/configstore/aikido-cli.json`. If you don't want this behaviour (e.g. for security related issues), you can also provide your API key to `aikido-cli` by adding `--apikey <your-api-key-here>` to every command. However, for the examples below, we'll assume you've used `aikido-cli apikey <your-api-key-here>` to save your API key.

## Usage

Using the `aikido-cli` to start new scans is very straightforward.

```sh
$ aikido-cli scan <repository_id> <base_commit_id> <head_commit_id>
```

For more information about these parameters, please refer to the

## Help & contributing

For more information about all available commands and options, execute:

```sh
$ aikido-cli help
```

```sh
$ aikido-cli help <command>
```

If you are missing functionality in this cli tool, please feel free to add it. If you've detected a bug, please submit a PR. Check out [CONTRIBUTING.md](CONTRIBUTING.md) for more information.


# Other resources

- [Aikido Official Website](https://aikido.dev)
- [Aikido Github Actions Workflow](https://github.com/AikidoSec/github-actions-workflow)
- [Aikido on Twitter](https://twitter.com/AikidoSecurity)


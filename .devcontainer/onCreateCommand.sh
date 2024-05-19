#!/bin/sh

set -eu

sudo chown node:node /home/node/.cache
sudo chown node:node /home/node/.cache/node
sudo chown node:node /home/node/.cache/yarn
sudo chown node:node node_modules */*/node_modules

yarn install --immutable < /dev/null
yarn serverless dynamodb install

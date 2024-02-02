#!/bin/sh

set -eu

sudo chown node:node /home/node/.cache/yarn
sudo chown node:node node_modules */*/node_modules

yarn install --frozen-lockfile
yarn serverless dynamodb install

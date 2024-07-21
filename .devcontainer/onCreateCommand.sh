#!/bin/sh

set -eu

sudo chown node:node /home/node/.cache
sudo chown node:node /home/node/.cache/node

# Set up Corepack aliases
cat <<EOF >> ~/.bash_aliases
alias yarn="corepack yarn"
alias yarnpkg="corepack yarnpkg"
alias pnpm="corepack pnpm"
alias pnpx="corepack pnpx"
alias npm="corepack npm"
alias npx="corepack npx"
EOF

(
    npx nvm-auto
    sudo -i "$(which corepack)" enable
    pnpm install --frozen-lockfile
    pnpm serverless dynamodb install
) < /dev/null

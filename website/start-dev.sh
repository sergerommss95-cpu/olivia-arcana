#!/bin/bash
export PATH="/Users/macbookpro/.local/bin:/tmp/node-v20.18.0-darwin-x64/bin:$PATH"
exec node node_modules/.bin/next dev --port 3333

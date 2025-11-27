#!/bin/bash

on-my-box() {
  if [ -t 0 ]; then
    payload=$(jq -n --args '{args: $ARGS.positional, stdin: null}' "$@")
  else
    input=$(cat)
    payload=$(printf "%s" "$input" | jq -Rs --args '{args: $ARGS.positional, stdin: (. | @base64)}' "$@")
  fi
  response=$(curl -fsSL -X "POST" "$ON_MY_BOX_ENDPOINT/execute" -H "Authorization: $ON_MY_BOX_AUTHORIZATION" -H "Content-Type: plain/text" -d "$payload" -H "Accept: text/plain")
  echo "$response" | jq -j '.stdout'
  echo "$response" | jq -j '.stderr' >&2
  exit_code=$(echo "$response" | jq -r '.exitCode')
  return "$exit_code"
}

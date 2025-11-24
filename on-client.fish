#!/bin/sh

function on-client
  if isatty stdin
    set payload (jq -n --args '{args: $ARGS.positional, stdin: null}' $argv)
  else
    read -z input
    set payload (printf "%s" $input | jq -Rs --args '{args: $ARGS.positional, stdin: (. | @base64)}' $argv)
  end
  set response (curl -fsSL -X "POST" $BACK_SSH_ENDPOINT/execute -H "Authorization: $BACK_SSH_AUTHORIZATION" -H "Content-Type: plain/text" -d "$payload" -H "Accept: text/plain")
  echo $response | jq -j '.stdout'
  echo $response | jq -j '.stderr' >&2
  set exit_code (echo $response | jq -r '.exitCode')
  return $exit_code
end

#!/bin/sh

WORKSPACE="$(cd "${1:-$PWD}" && pwd -P)"
HOSTNAME="$(echo "$SSH_CONNECTION" | awk '{print $3}')"

echo open "vscode://vscode-remote/ssh-remote+$USER@$HOSTNAME$WORKSPACE?windowId=_blank"

on-my-box open "vscode://vscode-remote/ssh-remote+$USER@$HOSTNAME$WORKSPACE?windowId=_blank"

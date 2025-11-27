#!/bin/sh

WORKSPACE="$(cd "${1:-$PWD}" && pwd -P)"
HOSTNAME="$(echo "$SSH_CONNECTION" | awk '{print $3}')"

on-my-box open "zed://ssh/$USER@$HOSTNAME$WORKSPACE"

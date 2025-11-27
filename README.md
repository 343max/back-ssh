# on-my-box

`on-my-box` is a wrapper arround ssh that allow the user to run shell commands on the client machine from the server one sshed into.

For example you can from your ssh server you can open a URL on your Mac using

```sh
on-my-box open https://github.com/
```

you can write a script that allows you to run the equivalent to `code .` to open the current dir in vscode like this:

```sh
WORKSPACE="$(cd "${1:-$PWD}" && pwd -P)"
HOSTNAME="$(echo "$SSH_CONNECTION" | awk '{print $3}')"

on-host open "vscode://vscode-remote/ssh-remote+$USER@$HOSTNAME$WORKSPACE?windowId=_blank"
```

here is the same thing for Zod if you prefer:

```sh
WORKSPACE="$(cd "${1:-$PWD}" && pwd -P)"
HOSTNAME="$(echo "$SSH_CONNECTION" | awk '{print $3}')"

on-host open "zed://ssh/$USER@$HOSTNAME$WORKSPACE"
```

or a script that mounts the current directory on your host machine using `rclone`:

```sh
WORKSPACE="$(cd "${1:-$PWD}" && pwd -P)"
USER="$(on-my-box whoami)

on-host open "/Users/$USER$/mnt"
on-host rclone mount server:$WORKSPACE "/Users/$USER$/mnt"
```

## Setup

See (setup.md)[SETUP.md]

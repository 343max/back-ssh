# Fish shell

Add this to your `config.fish`:

```sh
if set -q BACK_SSH_ENDPOINT
  curl -fsSL -H "Authorization: $BACK_SSH_AUTHORIZATION" $BACK_SSH_ENDPOINT/activate/fish | source
end
```
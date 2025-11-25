# Fish shell

Add this to your `config.fish`:

```sh
if set -q ON_MY_BOX_ENDPOINT
  curl -fsSL -H "Authorization: $ON_MY_BOX_AUTHORIZATION" $ON_MY_BOX_ENDPOINT/activate/fish | source
end
```
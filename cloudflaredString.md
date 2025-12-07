


# Add cloudflare gpg key
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v2.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v2.gpg >/dev/null

# Add this repo to your apt repositories
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v2.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list

# install cloudflared
sudo apt-get update && sudo apt-get install cloudflared

# one time run
cloudflared tunnel run --token eyJhIjoiMTlmNWI1ZTFkMTQyOGJkM2JlYjdmNGEyODBkZGE4OGIiLCJ0IjoiZjU2ZmNjMWItMTBlZS00MzI3LWIyNDItYjBlMzJhYWJhOTE5IiwicyI6Ik56RXhaRFJtWXpNdFkyUXpOaTAwTXpZeExXRXdaRGN0WkRRNU0yWXdabUUyWXpZdyJ9

# setup service
sudo cloudflared service install eyJhIjoiMTlmNWI1ZTFkMTQyOGJkM2JlYjdmNGEyODBkZGE4OGIiLCJ0IjoiZjU2ZmNjMWItMTBlZS00MzI3LWIyNDItYjBlMzJhYWJhOTE5IiwicyI6Ik56RXhaRFJtWXpNdFkyUXpOaTAwTXpZeExXRXdaRGN0WkRRNU0yWXdabUUyWXpZdyJ9
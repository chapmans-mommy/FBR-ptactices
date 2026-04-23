## 1 cmd
redis-server
redis-cli ping (answer =  PONG)

## 2 powershell (backend) vs code

## tests due swagger 
1. enter as admin
2. GET /api/products (первый раз = source:server, второй = source:cache)
3. GET /api/users (первый раз = source:server, второй = source:cache)
4. POST /api/products создать товар 
   GET /api/products/{id} (первый раз = source:server, второй = source:cache)
5. GET /api/products → "source": "cache"
   POST /api/products
   GET /api/products → "source": "server"

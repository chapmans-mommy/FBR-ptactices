terminal 1: npm run producer
terminal 2: npm run worker1 
terminal 3: npm run worker2
terminal 4: Invoke-RestMethod -Uri "http://localhost:3000/tasks" -Method POST -ContentType "application/json" -Body '{"type":"email","payload":{"to":"user@example.com","subject":"Hello"}}'
1 окно powershell: & "C:\Users\Валерия\AppData\Local\Programs\mongosh\mongosh.exe"
2 окно powershell: & "C:\Users\Валерия\AppData\Local\Programs\mongosh\mongosh.exe" --username YourMongoAdmin --password 1234 --authenticationDatabase admin
3 окно powershell: node server.js
проверка на работу соединения:  & "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db --auth
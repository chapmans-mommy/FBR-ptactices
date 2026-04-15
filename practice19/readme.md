ТЕСТИРОВАНИЕ API ПОЛЬЗОВАТЕЛЕЙ (PostgreSQL) 

1 Создание пользователей: 
Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"first_name":"Ivan","last_name":"Petrov","age":25}' 

Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"first_name":"Maria","last_name":"Ivanova","age":30}'

Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"first_name":"Alexey","last_name":"Sidorov"}' 
(возраст не указан)

2 Получение всех пользователей:
(Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method GET -UseBasicParsing).Content 
| ConvertFrom-Json | ConvertTo-Json -Depth 10

3 Получение пользователя с ID=1:
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/users/1" -Method GET -UseBasicParsing
$user = $response.Content 

4 Обновление пользователя с ID=1 (изменение возраста):" 
Invoke-WebRequest -Uri "http://localhost:3000/api/users/1" -Method PATCH -Headers @{"Content-Type"="application/json"} -Body '{"age":26}' -UseBasicParsing 

5 Удаление пользователя с ID=3:
Invoke-WebRequest -Uri "http://localhost:3000/api/users/3" -Method DELETE -UseBasicParsing 

6 Финальный список пользователей:
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/users" -Method GET -UseBasicParsing


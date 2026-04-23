## 3 terminals vs code 
    $env:PORT=3000/3001/3002
    node server.js

## new terminal
    cd C:\nginx-1.24.0
    .\nginx.exe

## new terminal 
    curl.exe http://localhost:8080/ 
    couple of times 

## stop server 3000
    curl.exe http://localhost:8080/
    couple of times

## again server 3000 
    curl.exe http://localhost:8080/

## new terminal
    cd C:\haproxy
    .\haproxy.exe -f haproxy.cfg

    !!!(if error tasklist | findstr haproxy    then    taskkill /f /im haproxy.exe)

    curl.exe http://localhost:8081/

## in browser 
    http://localhost:8404/stats

## in the last terminal 
    curl.exe http://localhost:8081/
    couple of times
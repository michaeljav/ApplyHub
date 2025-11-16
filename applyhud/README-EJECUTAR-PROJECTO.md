0.Instalar docker desktop para tu version de Sistema operativo
https://www.docker.com/products/docker-desktop/

1.descargar projecto:
https://github.com/michaeljav/ApplyHub/tree/main

2.ponerte en esta ruta donde esta projecto
...ApplyHub\applyhud

3.dentro de ..\ApplyHub\applyhud
docker compose up --build -d

4.abrir aplicacion
http://localhos:3000/

Nota:
codigo si deseas borrar todo y comenzar de nuevo
Comando único para limpiar TODO en Docker

docker stop $(docker ps -aq) 2>/dev/null; docker rm -f $(docker ps -aq) 2>/dev/null; docker rmi -f $(docker images -aq) 2>/dev/null; docker volume rm -f $(docker volume ls -q) 2>/dev/null; docker network rm $(docker network ls -q) 2>/dev/null

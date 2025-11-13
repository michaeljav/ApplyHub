
--run docker

docker compose up -d


leer  postgress  con extension de microsoft PostgreSQL

docker run -d \
  --name my_postgres \
  -e POSTGRES_USER=adminuser \
  -e POSTGRES_PASSWORD=adminpassword123 \
  -e POSTGRES_DB=appyhub_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16


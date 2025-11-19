🟦 1. pgweb (Runs in browser – portable) ver postgress en linea web

A single executable you run once and it opens a browser UI.

✔️ No installation
✔️ Lightweight
✔️ Open-source
✔️ Portable (just run the file)

Run it like this:

pgweb --url postgres://user:pass@localhost:5432/dbname
pgweb --url postgres://adminuser:adminpassword123@localhost:5432/appyhub_db

cd /c/personal/iad/app/ApplyHub/client_pg_light/pgweb_windows_amd64
./pgweb_windows_amd64 --url postgres://adminuser:adminpassword123@localhost:5432/appyhub_db

DATABASE_URL="postgresql://adminuser:adminpassword123@localhost:5432/appyhub_db"

C:\personal\iad\app\ApplyHub\client pg light\pgweb_windows_amd64

subir solo un servicio postgres desde docker compose
docker compose up --build -d postgres

#!/bin/sh
set -eu

MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"
DB_NAME="${MYSQL_DATABASE:-liuyao_db}"
RESET="${DB_RESET_ON_STARTUP:-true}"

if [ "$RESET" != "true" ]; then
  echo "[db-init] DB_RESET_ON_STARTUP=$RESET, skip reset/init."
  exit 0
fi

if [ "$DB_NAME" != "liuyao_db" ]; then
  echo "[db-init] Warning: MYSQL_DATABASE=$DB_NAME, but SQL scripts currently hardcode database name liuyao_db."
fi

echo "[db-init] Waiting for MySQL... host=$MYSQL_HOST port=$MYSQL_PORT"
until mysqladmin ping -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --silent; do
  sleep 2
done

echo "[db-init] Dropping database: $DB_NAME"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;"

echo "[db-init] Initializing schema/data from latest SQL files"
for file in \
  00_init_complete.sql \
  01_init_data.sql \
  02_auth_permissions_migration.sql \
  02_auth_permissions_enhancement.sql \
  insert_64_gua_complete.sql; do
  echo "[db-init] Executing /sql/$file"
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 < "/sql/$file"
done

echo "[db-init] Done. Tables in liuyao_db:"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 -e "USE liuyao_db; SHOW TABLES;"

#!/bin/sh
set -eu

MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"
DB_NAME="${MYSQL_DATABASE:-liuyao_db}"
RESET="${DB_RESET_ON_STARTUP:-false}"

if [ "$DB_NAME" != "liuyao_db" ]; then
  echo "[db-init] Warning: MYSQL_DATABASE=$DB_NAME, but SQL scripts currently hardcode database name liuyao_db."
fi

echo "[db-init] Waiting for MySQL... host=$MYSQL_HOST port=$MYSQL_PORT"
until mysqladmin ping -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --silent; do
  sleep 2
done

# 非破坏式默认：数据库已有表时跳过初始化，避免部署时清空生产数据。
# 仅当库为空（首次部署）或 DB_RESET_ON_STARTUP=true（显式要求重建）时才执行 SQL。
TABLE_COUNT=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null || echo 0)

if [ "$RESET" = "true" ]; then
  echo "[db-init] DB_RESET_ON_STARTUP=true, dropping and rebuilding database: $DB_NAME"
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$DB_NAME\`;"
elif [ "$TABLE_COUNT" != "0" ]; then
  echo "[db-init] Database $DB_NAME already has $TABLE_COUNT tables, skip init (set DB_RESET_ON_STARTUP=true to force rebuild)."
  exit 0
else
  echo "[db-init] Database $DB_NAME is empty, initializing schema/data."
fi

echo "[db-init] Initializing schema/data from SQL files"
for file in \
  00_init_complete.sql \
  01_init_data.sql \
  02_auth_permissions_migration.sql \
  02_auth_permissions_enhancement.sql \
  02_bazi_tables.sql; do
  echo "[db-init] Executing /sql/$file"
  mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 < "/sql/$file"
done

echo "[db-init] Done. Tables in $DB_NAME:"
mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 -e "USE \`$DB_NAME\`; SHOW TABLES;"

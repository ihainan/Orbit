# Database Management

## Initial Setup

When starting the database for the first time:

```bash
docker-compose up -d
```

The `init.sql` script will automatically create all tables.

## Migrations

### Running Migrations

To apply database migrations (for existing databases):

```bash
cd database
./migrate.sh
```

Or with custom container name:

```bash
CONTAINER_NAME=orbitals_postgres ./migrate.sh
```

The script will:
- Check if the database container is running
- Execute migrations inside the Docker container
- Apply migrations in order (001, 002, etc.)
- Show success/failure for each migration

### Creating New Migrations

1. Create a new file in `migrations/` directory with format: `XXX_description.sql`
   - Use sequential numbering (001, 002, etc.)
   - Example: `002_add_tags_table.sql`

2. Write your migration SQL:
   ```sql
   -- Migration: Description
   -- Date: YYYY-MM-DD

   ALTER TABLE ...;
   CREATE INDEX ...;
   ```

3. Make it idempotent using `IF NOT EXISTS` or `IF EXISTS` clauses

4. Run the migration:
   ```bash
   ./migrate.sh
   ```

## Migration History

- **001_add_avatar_to_posts.sql** - Add avatar_id to posts table to preserve historical avatar information
- **002_add_repost_support.sql** - Add repost functionality (reposted_from_id and repost_comment columns)

## Data Persistence

Database data is stored in `../data/postgres/` which is:
- Mounted to the host filesystem
- Not deleted when running `docker-compose down`
- Gitignored (data is not committed)

To completely reset the database:

```bash
docker-compose down
rm -rf ../data/postgres
docker-compose up -d
```

## Backup & Restore

### Backup

```bash
docker exec orbitals_postgres pg_dump -U orbitals orbitals_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
docker exec -i orbitals_postgres psql -U orbitals orbitals_db < backup_file.sql
```

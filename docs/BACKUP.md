# Backup plan

## Database

Nightly dump with cron:

```
0 2 * * * pg_dump -U photoapp -F c -f /srv/photoapp/backups/db_$(date +\%F).dump photoapp
```

## Media

Mirror media to external storage:

```
rsync -a --delete /srv/photoapp/media/ /mnt/backup/photoapp_media/
```

Keep at least 7 days of DB dumps and verify restores quarterly.

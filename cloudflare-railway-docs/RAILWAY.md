# Railway deployment rules

Railway detects a `Dockerfile` at the service root. A Compose stack is translated into separate Railway services; Compose `depends_on` is not carried over, so applications must retry dependencies at startup. Persistent files belong on a Railway Volume, while databases should preferably use Railway managed services. Cron services must terminate and cannot run as permanent workers.

References:

- https://docs.railway.com/builds/dockerfiles
- https://docs.railway.com/guides/docker-compose
- https://docs.railway.com/reference/volumes
- https://docs.railway.com/cron-jobs

# Reactive Resume

Deploy the official `amruthpillai/reactive-resume:latest` image as one Railway service and add a separate Railway PostgreSQL service. Required Variables are `APP_URL`, `DATABASE_URL`, and `AUTH_SECRET`; set `PORT=3000` unless deliberately changing the container port. If S3 is disabled, mount a Volume at `/app/data`. Keep PostgreSQL private and wait for migrations/health checks before exposing the app.

Official reference: https://docs.rxresu.me/self-hosting/docker

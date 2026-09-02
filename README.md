# Survivor - ProfilsActifs


## How to un locally in production environment

Requirements:
- Docker

Simply run:
```shell
docker compose up
```

And the site will be accessible on port 3000.

If you want to change the port, in `profils-actif/Dockerfile`, on lines 78 and 106, replace `3000` by the desired port number.

## How to un locally in development environment

Requirements:
- Docker
- npm

### 1. Start the database
```shell
docker compose up postgres
```

### 2. Run the server
In the `profils-actifs` directory:
```shell
npm install
npm run dev
```

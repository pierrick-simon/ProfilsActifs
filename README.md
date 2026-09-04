# Survivor - ProfilsActifs

## How to un locally in production environment

### 1. Requirements:
- Docker

### 2. Environment file creation

Copy `.env.example` to a file named `.env` and modify the values accordingly.

### 3. Simply run:
```shell
docker compose up
```

And the site will be accessible on port 3000.

If you want to change the port, in `Dockerfile`, replace `3000` by the desired port number.

## How to un locally in development environment

### 1. Requirements:
- Docker
- npm

### 2. Environment file creation

Copy `.env.example` to a file named `.env` and modify the values accordingly.

### 3. Start the database
```shell
docker compose up postgres
```

### 4. Run the server
```shell
npm install
npm run dev
```

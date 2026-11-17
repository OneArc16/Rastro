## Instalación con Docker (uso diario)

La app corre en un contenedor que arranca solo al prender el PC. Los datos
(base SQLite, fotos y respaldos) viven en el volumen `rastro-datos`.

Requisitos: Docker Desktop con «Start Docker Desktop when you sign in» activado
y un archivo `.env` (copiá `.env.example`) con `APP_BASE_URL` apuntando a la IP
del PC en la red local, por ejemplo `http://192.168.1.114:3000`.

```bash
docker compose up -d --build   # construye la imagen y deja la app corriendo
docker compose logs -f         # ver la salida del servidor
docker compose down            # detenerla (vuelve a arrancar con `up -d`)
```

Al iniciar, el contenedor aplica las migraciones pendientes. Si la base ya
tenía datos, antes crea un respaldo en `data/respaldos/` dentro del volumen.

Para actualizar después de cambiar el código: `docker compose up -d --build`.

Para desarrollar en local con el contenedor corriendo, `pnpm dev` busca el
primer puerto libre desde 3000 (en WSL también descarta los que usa Windows,
como el de Docker) y avisa cuál tomó. Con `PORT=4000 pnpm dev` se fija uno.

Cargar una base existente en un volumen vacío (una sola vez, con `pnpm dev` y
el contenedor detenidos, para que no queden cambios a medias en `rastro.db-wal`):

```bash
docker run --rm -i -v rastro-datos:/app/data rastro:latest \
  sh -c 'cat > /app/data/rastro.db' < data/rastro.db
```

Sacar una copia de la base desde el volumen (primero `docker compose stop`):

```bash
docker run --rm -v rastro-datos:/app/data rastro:latest \
  cat /app/data/rastro.db > rastro-copia.db
```

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

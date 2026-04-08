FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

# Official nginx image substitutes ${PORT} from env into templates → conf.d
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

# Default for local `docker run`; Render (and others) override PORT
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

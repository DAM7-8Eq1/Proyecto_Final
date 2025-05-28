# 1. Etapa de construcción
FROM node:20-slim 

WORKDIR /app
                               
COPY package*.json ./

RUN npm install

# 2.2 Copiar artefactos desde builder
COPY . .

# 2.4 Exponer el puerto que usa tu CAP service
EXPOSE 8081                                       

# 2.5 Arrancar la aplicación usando tu script start
CMD ["npm", "start"]   
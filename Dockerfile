FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Make the entrypoint script executable
RUN chmod +x /usr/src/app/docker-entrypoint.sh

# Set the entrypoint script
ENTRYPOINT ["/usr/src/app/docker-entrypoint.sh"]

# The main command to run the application
CMD ["npm", "start"]


FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies first (good caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source
COPY . .

# Create logs directory (in case host volume not mounted yet)
RUN mkdir -p logs

# Expose the port the app uses
EXPOSE 3000

# Run the app
CMD ["npm", "start"]

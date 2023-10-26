# Use a base Node.js image
FROM node:16

# Set the working directory inside the container
WORKDIR /express-docker

RUN apt-get update && \
    apt-get install -y wget gnupg && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    apt-get install libvulkan1


# Copy package.json and package-lock.json to the container
COPY package*.json .

# Install dependencies
RUN npm install
RUN node node_modules/puppeteer/install.mjs
# Copy the rest of your application code to the container
COPY . .

# Expose the port your Express.js server is running on
EXPOSE 3000

# Command to start your Express.js server
CMD ["node", "server.js"]
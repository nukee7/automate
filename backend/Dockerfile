FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends msmtp && \
    rm -rf /var/lib/apt/lists/* && \
    ln -sf /usr/bin/msmtp /usr/sbin/sendmail

WORKDIR /app

COPY msmtprc /etc/msmtprc
RUN chmod 644 /etc/msmtprc

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "dev"]
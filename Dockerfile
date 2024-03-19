FROM --platform=linux/riscv64 ghcr.io/stskeeps/node:20-jammy-slim-estargz 

WORKDIR /opt/cartesi/dapp
COPY . .
RUN apt-get update  &&  apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
RUN yarn install 
ENV ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004"

CMD ["node", "dapp.js"]
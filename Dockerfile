FROM --platform=linux/riscv64 ghcr.io/stskeeps/node:20-jammy-slim-estargz 

WORKDIR /opt/cartesi/dapp
COPY . .
RUN yarn install 
ENV ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004"

CMD ["node", "dapp.js"]
# GenArt-Lambada

---

GenArt is a Dapp which allows us to generate madelbrot images in a deterministic fashion.

This project leverages [Cartesi-Lambada](https://github.com/zippiehq/cartesi-lambada) ([wiki](https://github.com/zippiehq/cartesi-lambada/wiki)) a modular implementation of the Cartesi tech stack where the execution layer is provided by a Cartesi machine and the DA layer is provided by [espresso](https://www.espressosys.com/)/[celestia](https://celestia.org/).

## Steps to build

### In a terminal:

```
docker run -p 127.0.0.1:8081:8081 -p 127.0.0.1:8080:8080 -p 127.0.0.1:3033:3033 --privileged zippiehq/cartesi-lambada-devkit:1.1
```

This opens up a code-server development environment in web browser at http://localhost:8081
Inside the code-server you can clone [lambada-primes](https://github.com/jjhbk/lambada-primes) this repo.

### In the code-server

Open up a terminal inside the code-server
`cd cartesign-lambada && cartesi-build`

After the build is successful you will find a State CID which is an IPFS directory where the entire Cartesi machine state is stored along with some crucial information on how data comes into the cartesi machine.

[Video-Demo](https://www.youtube.com/watch?v=OsOa8KPPrls)

## Subscribing, submitting and reading to your new chain

### In a new terminal

`curl http://127.0.0.1:3033/subscribe/<chain CID>`

the node now follows your chain

#### send transaction with:

`curl -X POST -d 'transaction data' -H "Content-type: application/octet-stream" http://127.0.0.1:3033/submit/<chain CID>`

#### read latest state with:

`curl http://127.0.0.1:3033/latest/<chain CID>`

#### Access IPFS gateway

`http://127.0.0.1:8080/ipfs/<chain or state CID>`

#### Check your computation results

`http://127.0.0.1:8080/ipfs/<chain or state CID>/output/primes.json`

####

All the relevant logs of the Lambada node and the Cartesi machine can be found inside the files of Docker container

`tmp/cartesi-machine.log`
`tmp/lambada.log`
`tmp/ipfs-base.log`
`code-server.log`

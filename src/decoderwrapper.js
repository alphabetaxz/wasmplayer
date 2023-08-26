class Decoder {
    initialized = false
    dataArray = []
    constructor() {
        this.initialized = false
        this.dataArray = []
        console.log("decoder construct");
    }

    loadWasm(urlPath) {
        console.log("loadWasm: ", urlPath);
        importScripts(urlPath);
        self.Module.onRuntimeInitialized = () => {
            console.log("wasm loaded...");
            this.openDecoder();
            this.initialized = true;
            this.decodeData()
        }
    }

    openDecoder() {
        console.log("open decoder ...");
        function callback(addrY, addrU, addrV, strideY, strideU, strideV, width, height, pts) {
            const outY = HEAPU8.subarray(addrY, addrY+strideY*height);
            const outU = HEAPU8.subarray(addrU, addrU+strideU*height/2);
            const outV = HEAPU8.subarray(addrV, addrV+strideV*height/2);
            let obj = {
                bufY: new Uint8Array(outY),
                bufU: new Uint8Array(outU),
                bufV: new Uint8Array(outV),
                strideY,
                strideU,
                strideV,
                width,
                height,
                pts
            }
            self.postMessage({result: obj})
        }
        const videoCallback = Module.addFunction(callback, "viiiiiiiii")
        const ret = Module._open_decoder(0, videoCallback, 0)
    }

    decodeData() {
        // console.log("decode data ...");
        if (this.initialized) {
            this.dataArray.forEach(data => {
                const pts = data.data.PTS
                let pesByte = data.data.data_byte
                let len = pesByte.length
                let cache = Module._malloc(len)
                Module.HEAPU8.set(pesByte, cache)
                const ret = Module._decode_data(cache, len, pts)
                Module._free(cache)
                // console.log("decode data ..., ret = " + ret) 
            })
            this.dataArray = []
        }
    }

    push(pes) {
        this.dataArray.push(pes)
        this.decodeData()
    }
}

const decoder = new Decoder()

self.onmessage = (event) => {
    const {type, data} = event.data
    switch(type) {
        case 'loadWasm':
            decoder.loadWasm(data)
            break
        case 'decode':
            decoder.push(data)
            break
        default:
            console.log("decoder -> unnkown type: ", type);
    }
}
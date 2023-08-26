import { M3u8Parser, Segment } from "./M3u8Parser.js";
// import { setupCanvas, renderFrame1 } from "./webgl.js";

export class SimplePlayer {
    myCanvas: any;
    yuvPlayer: any;
    options: any;
    httpWorker: any;
    demuxWorker: any;
    decoderWorker: any;
    m3u8Url: string = "";

    constructor(canvas: any, options: any) {
        this.myCanvas = canvas
        this.options = options;
        this.m3u8Url = options.m3u8Url;

        this.init();
    }

    init(): void {
        console.log("Simple player init ..");
        this.yuvPlayer = setupCanvas(this.myCanvas, { preserveDrawingBuffer: false });
        this.httpWorker = new Worker("./js/HttpReq.js")
        this.demuxWorker = new Worker("./js/demuxwrapper.js", {type: 'module'})
        this.decoderWorker = new Worker("./js/decoderwrapper.js")

        this.decoderWorker.onmessage = (event: MessageEvent) => {
            const data = event.data;
            let obj = data.result;

            renderFrame1(this.yuvPlayer, obj.bufY, obj.bufU, obj.bufV, obj.width, obj.height);
        }

        this.demuxWorker.onmessage = (event: MessageEvent) => {
            this.decoderWorker.postMessage({
                type: 'decode',
                data: event.data
            })
        }
        const url = 'http://localhost:8000/js/libffmpeg.js'
        this.decoderWorker.postMessage({
            type: 'loadWasm',
            data: url
        })
        this.loadM3u8();
    }

    play(): void {
        console.log("Simple player play ..");
    }

    stop(): void {
        console.log("Simple player stop ..");
    }

    loadM3u8(): void {
        console.log("Simple player loadM3u8 ..");
        this.httpWorker.postMessage({
            url: this.m3u8Url,
            type: "m3u8"
        });
        this.httpWorker.onmessage = (event: MessageEvent) => {
            console.log("event data: ", event.data);
            const { result, type, data } = event.data
            if (result === "ok") {
                let segs = this.parseM3u8(data)
                for(const seg of segs) {
                    this.loadTs(seg)
                }

            } else {
                console.log("failed to get m3u8 file!");
            }
        }
    }

    parseM3u8(data: string): Segment[] {
        console.log("Simple player parseM3u8 ..");
        const parser = new M3u8Parser(data)
        const segs = parser.getSegmengs()
        return segs;
    }

    getBaseUrl(file: string): string {
        const isAbsolute = file.indexOf("//") > -1;
        if (isAbsolute) {
            return ''
        }
        const srcUrl = this.options.m3u8Url
        const idx = srcUrl.lastIndexOf('/')
        return srcUrl.substring(0, idx + 1);
    }

    loadTs(seg: Segment): void {
        console.log("Simple player loadTs ..");
        const baseUrl = this.getBaseUrl(seg.file)
        const tsUrl = baseUrl + seg.file
        this.httpWorker.postMessage({
            type: "ts",
            url: tsUrl
        })
        this.httpWorker.onmessage = (event: MessageEvent) => {
            const { result, type, data } = event.data
            if (!data || result === 'error') {
                console.log("loadTs", "httpWorker error!");
            } else if (type === 'ts') {
                console.log("demux ts....................................");
                this.demuxWorker.postMessage({
                    type: 'STARTDEMUX',
                    buffer: data
                })
            } else {
                console.warn("loadTs", "unknown error !!");
            }
        }
    }
}
import {TSDemux, Events as DemuxerEvents} from "./demuxer.js"


export class TsDemux {
    demuxer = null;
    dataArray = null;

    constructor() {
        this.init();
        this.dataArray = [];
    }

    init() {
        this.demuxer = new TSDemux({
            debug: true // if env is production, debug should be false or not specified.
        });
        this.demuxer.on(DemuxerEvents.DEMUX_DATA, (e) => {
            this.dataArray.push(e)
        });

        this.demuxer.on(DemuxerEvents.DONE, (e) => {
            console.log("Demux Done!!")
            this.dataArray.forEach(element => {
                this.tsDemuxed(element)
            });
        });
    }

    postVideo(pes) {
        self.postMessage({
            data: pes
        })
    }

    tsDemuxed(data) {
        const { stream_type: streamType, pes } = data
        switch(streamType) {
            case 27:
            case 36:
                this.postVideo(pes)
                break;
            case 3:
            case 15:
            case 17:
                break;
            default:
                console.log("streamType :",streamType);
        }
    }

    push(data) {
        this.demuxer.push(data, {done: true})
    }
}

const tsDemux = new TsDemux()

self.onmessage = function(event) {
    console.log(`event data: ${event.data}`);
    let data = event.data
    let type = data.type
    let buffer = data.buffer

    switch(type) {
        case 'STARTDEMUX':
            if (tsDemux) {
                tsDemux.push(buffer)
            }
            break;
        default:
            console.log("unknown event type: ", type);
    }
}
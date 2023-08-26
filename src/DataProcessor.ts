// import { TsDemux, Decoder } from './demuxwrapper.js';

// class DataProcessor {
//     demuxer: TsDemux | null;
//     decoder: Decoder| null;

//     constructor() {
//         this.decoder = new Decoder();
//         this.demuxer = new TsDemux(this.decoder);
//         this.init()
//     }

//     init() {}
// }

// let dataProcessor = new DataProcessor();

// self.onmessage = function(event: MessageEvent) {
//     console.log(`event data: ${event.data}`);
//     let data = event.data
//     let type = data.type
//     let buffer = data.buffer

//     switch(type) {
//         case 'STARTDEMUX':
//             if (dataProcessor.demuxer) {
//                 dataProcessor.demuxer?.push(buffer)
//             }
//             break;
//         default:
//             console.log();
//     }
// }
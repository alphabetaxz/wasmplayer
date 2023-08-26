class HttpReq {
    constructor() {
        console.log("http request module ...");
    }

    async get(url: string, type: string) {
        console.log(`get url: ${url}, type: ${type}`);
        const response = await fetch(url);
        let data = null;
        if (type === 'm3u8') {
            data = await response.text()
        } else if (type === 'ts') {
            data = await response.arrayBuffer()
        }
        if (response.ok) {
            self.postMessage({
                result: "ok",
                type: type,
                data: data
            })
        } else {
            self.postMessage({result: 'failed'})
        }
    }
}

let httpReq: HttpReq = new HttpReq();

self.onmessage = function(event: MessageEvent) {
    console.log(`event data: ${event.data}`);
    httpReq.get(event.data.url, event.data.type);
}
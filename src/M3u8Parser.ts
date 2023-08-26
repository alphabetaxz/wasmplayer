
const matchers = {
    lineDelimiter: /\r?\n/,
    version: 'VERSION',
    targetDuration: 'TARGETDURATION',
    mediaSequence: 'MEDIA-SEQUENCE',
    discontinuity: 'DISCONTINUITY',
    endList: 'ENDLIST',
    magicHeader: '#EXTM3U',
    tagPrefix: '#EXT',
    segPrefix: '#EXTINF',
    isBlank: (line: string) => line === "",
    isComment: (line: string) => line && line[0] === "#" && !line.startsWith(matchers.tagPrefix),
    canSkip: (line: string) => matchers.isBlank(line) || matchers.isComment(line),
    segParse: /^#EXTINF: *([0-9.]+)(,(.*))$/,
    tagParse: /^#EXT-X-([A-Z-]+)(:(.+))?$/
}

class TagInfo {
    VERSION: number = 0;
    TAGGETDURATION: number = 0;
    MEDIA_SEQUENCE: number = 0;
    DISCONTUNITY: boolean = false;
    ENDLIST: string = "EOF"
}

class Tag {
    name: string = "";
    value: string = "";

    setName(name: string) {
        this.name = name;
    }

    setValue(val: string) {
        this.value = val;
    }
}

export class Segment {
    file: string = "";
    name: string = "";
    idx: number = 0;
    start: number = 0;
    end: number = 0;
    discontunity: boolean = false;
    duration: number = 0;
    time: Date | null = null;
}

enum STATE {
    READTAG,
    ADDSEG
}

export class M3u8Parser {
    taginfo: TagInfo = new TagInfo()
    segments: Segment[] = [];
    currentSeg: Segment = this.segments[0];

    state: STATE = STATE.READTAG;

    constructor(data: string) {
        this.parse(data);
    }

    parse(m3u8Source: string): void {
        console.log("M3u8Parser parse ...");
        let lines = m3u8Source.split(matchers.lineDelimiter)
        if (lines[0] !== matchers.magicHeader) {
            console.error("parse", "it's invalid m3u8 header");
            return
        } else {
            lines = lines.slice(1)
        }
        lines.forEach(line => {
            if (matchers.canSkip(line)) {
                return
            }
            switch(this.state) {
                case STATE.READTAG:
                    this.readLine(line)
                    break;
                case STATE.ADDSEG:
                    this.addSeg(line);
                    break
                default:
                    console.error("Unknown case ...");
            }
        })
    }

    readLine(line: string): void {
        console.log("M3u8Parser readline ...");
        if (line.startsWith(matchers.segPrefix)) {
            return this.readSeg(line);
        }
        let tag = this.readTag(line)
        if (!tag) {
            console.warn("failed to read tag!");
            return;
        }
        switch(tag.name) {
            case matchers.version:
                this.taginfo.VERSION = parseFloat(tag.value)
                break
            case matchers.mediaSequence:
                this.taginfo.MEDIA_SEQUENCE = parseFloat(tag.value)
                break
            case matchers.discontinuity:
                this.taginfo.DISCONTUNITY = true;
                break;
            case matchers.targetDuration:
                this.taginfo.TAGGETDURATION = parseFloat(tag.value)
                break
            default:
                console.warn("readline", "unknown tag!");
        }
    }

    readTag(line: string): Tag {
        let parsed = matchers.tagParse.exec(line);
        let tag: Tag = new Tag()
        if (parsed !== null) {
            tag.setName(parsed[1])
            tag.setValue(parsed[3])
        }
        return tag;
    }

    readSeg(line: string): void {
        // #EXTINF:[0-9.]+
        let parsed = matchers.segParse.exec(line)
        if (parsed === null) {
            console.error("readSeg", "failed to parse segment line!");
            return
        }
        let duration = parseFloat(parsed[1]);
        duration = duration * 1000;
        this.currentSeg = new Segment();
        const lastSegment = this.segments[this.segments.length -1] || {start: 0, end: 0}
        this.currentSeg.start = lastSegment.end;
        this.currentSeg.end = lastSegment.end + duration;
        this.state = STATE.ADDSEG
    }

    addSeg(line: string): void {
        this.currentSeg.file = line;
        this.currentSeg.name = line.substring(line.lastIndexOf('/'), line.lastIndexOf('.'))
        this.currentSeg.idx = this.segments.length + 1;
        this.segments.push(this.currentSeg);
        this.state = STATE.READTAG;
    }

    getSegmengs(): Segment[] {
        return this.segments;
    }
}
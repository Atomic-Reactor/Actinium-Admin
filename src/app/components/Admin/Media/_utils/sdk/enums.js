const ENUMS = {
    ACTION_TYPE: 'DOMAIN_UPDATE',
    DEBUG: false,
    DIRECTORY: 'uploads',
    DOMAIN: 'Media',
    MAX_SIZE: 15728640,
    MAX_UPLOADS: 3,
    STATUS: {
        CANCELED: 'canceled',
        COMPLETE: 'complete',
        PENDING: 'pending',
        PROCESSING: 'processing',
        READY: 'ready',
        QUEUED: 'queued',
        UPLOADING: 'uploading',
    },
    TYPE: {
        AUDIO: ['MP3', 'OGG', 'WAV'],
        FILE: [
            'DOC',
            'DOCX',
            'HTML',
            'HTM',
            'ODS',
            'ODT',
            'PDF',
            'PPT',
            'PPTX',
            'TXT',
            'XLS',
            'XLSX',
        ],
        IMAGE: ['PNG', 'SVG', 'GIF', 'JPG', 'JPEG'],
        VIDEO: [
            'WEBM',
            'MPG',
            'MP2',
            'MPEG',
            'MPE',
            'MPV',
            'OGG',
            'MP4',
            'M4P',
            'M4V',
            'AVI',
            'WMV',
            'MOV',
            'QT',
            'FLV',
            'SWF',
            'AVCHD',
        ],
    },
};

export { ENUMS as default };

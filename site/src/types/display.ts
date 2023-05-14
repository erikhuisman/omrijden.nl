export interface VmsImageData {
    binary: string;
    encoding: string;
    mimeType: string;
}

export interface SimpleVmsUnit {
    id: string;
    updatedAt: string;
    image?: string;
    text?: string;
    title: string;
    location: string;
}
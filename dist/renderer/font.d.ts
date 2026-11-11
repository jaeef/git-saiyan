export interface TextRect {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
}
export declare function textWidth(text: string, scale: number, letterSpacing?: number): number;
export declare function textToRects(text: string, x: number, y: number, scale: number, color: string): TextRect[];

import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';

@Component({
  selector: 'app-gradient-picker',
  templateUrl: './gradient-picker.component.html',
  styleUrls: ['./gradient-picker.component.css']
})
export class GradientPickerComponent implements AfterViewInit {
  @ViewChild('gradientContainer', { static: true }) gradientContainer!: ElementRef;
  @ViewChild('gradientCanvas', { static: true }) gradientCanvas!: ElementRef;
  @ViewChild('colorDisplayCanvas', { static: true }) colorDisplayCanvas!: ElementRef;
  @ViewChild('image', { static: true }) image!: ElementRef;
  @ViewChild('tintedCanvas', { static: true }) tintedCanvas!: ElementRef;

  ctx!: CanvasRenderingContext2D | null;
  colorDisplayCtx!: CanvasRenderingContext2D | null;
  colorCache: Uint8ClampedArray | null = null;
  tintColor: string = 'rgba(255, 255, 255, 1)'; // Default color

  ngAfterViewInit(): void {
    this.initializeCanvas();
    this.drawImage();
  }

  initializeCanvas(): void {
    const canvas = this.gradientCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    this.ctx = ctx;

    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    let gradient, startColor, endColor, fac;

    for (let i = 0; i < h; i++) {
      gradient = ctx.createLinearGradient(0, i, w, i);
      fac = i / (h - 1);

      startColor = this.arrayToRGBA(this.lerp(
        [0.694, 0.608, 0.518, 1],
        [0.263, 0.227, 0.188, 1],
        fac
      ));
      endColor = this.arrayToRGBA(this.lerp(
        [0.831, 0.592, 0.318, 1],
        [0.361, 0.173, 0.059, 1],
        fac
      ));

      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, i, w, 1);
    }

    // Cache all pixel data
    const imageData = ctx.getImageData(0, 0, w, h);
    this.colorCache = imageData.data;

    const colorCanvas = this.colorDisplayCanvas.nativeElement;
    colorCanvas.width = 100;
    colorCanvas.height = 100;
    this.colorDisplayCtx = colorCanvas.getContext('2d');
    if (this.colorDisplayCtx) {
      this.colorDisplayCtx.fillStyle = '#ffffff'; 
      this.colorDisplayCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
    }
  }

  arrayToRGBA(arr: number[]): string {
    if (arr.length < 4) return 'rgba(0, 0, 0, 0)'; 
    const [r, g, b, a] = arr.map(v => Math.max(Math.min(Math.round(v * 255), 255), 0));
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`; 
  }

  lerp(a: number[], b: number[], fac: number): number[] {
    return a.map((v, i) => v * (1 - fac) + b[i] * fac);
  }

  onClick(event: MouseEvent): void {
    const rect = this.gradientCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.getColorFromCache(x, y);
  }

  getColorFromCache(x: number, y: number): void {
    if (this.colorCache && this.ctx) {
      const width = this.gradientCanvas.nativeElement.width;
      x = Math.max(0, Math.min(width - 1, Math.floor(x)));
      y = Math.max(0, Math.min(this.gradientCanvas.nativeElement.height - 1, Math.floor(y)));

      const index = (y * width + x) * 4;
      const r = this.colorCache[index];
      const g = this.colorCache[index + 1];
      const b = this.colorCache[index + 2];
      const a = this.colorCache[index + 3] / 255;

      if (r !== undefined && g !== undefined && b !== undefined && !isNaN(a)) {
        this.tintColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        console.log('Selected Color:', this.tintColor);
        this.updateColorDisplay(this.tintColor);
        this.drawImage();
      } 
    }
  }

  updateColorDisplay(color: string): void {
    if (this.colorDisplayCtx) {
      this.colorDisplayCtx.fillStyle = color;
      this.colorDisplayCtx.fillRect(0, 0, this.colorDisplayCanvas.nativeElement.width, this.colorDisplayCanvas.nativeElement.height);
    }
  }
  drawImage(): void {
    const img = this.image.nativeElement as HTMLImageElement;
    const originalCanvas = this.tintedCanvas.nativeElement as HTMLCanvasElement;
    const originalCtx = originalCanvas.getContext('2d');

    if (!originalCtx || !img.complete) return;

    
    const newWidth = img.naturalWidth * 0.2;
    const newHeight = img.naturalHeight * 0.2;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return;
    
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;

    tempCtx.drawImage(img, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    const tint = this.parseRGBA(this.tintColor);
    const strength = 1.5;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3] / 255; 

      if (a > 0) { 
        data[i] = Math.min(255, r * (1 - strength) + tint[0] * 255 * strength);
        data[i + 1] = Math.min(255, g * (1 - strength) + tint[1] * 255 * strength);
        data[i + 2] = Math.min(255, b * (1 - strength) + tint[2] * 255 * strength);
        data[i + 3] = Math.min(255, a * 255 * (1 - strength) + tint[3] * 255 * strength); 
      }
    }

    tempCtx.putImageData(imageData, 0, 0);

    // Resize the original canvas
    originalCanvas.width = newWidth;
    originalCanvas.height = newHeight;
    originalCtx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
  }



  parseRGBA(rgba: string): number[] {
    const match = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(\.\d+)?))?\)$/);
    if (match) {
      return [
        parseFloat(match[1]) / 255,
        parseFloat(match[2]) / 255,
        parseFloat(match[3]) / 255,
        match[4] ? parseFloat(match[4]) : 1
      ];
    }
    return [1, 1, 1, 1]; // Fallback to white if parsing fails
  }
}

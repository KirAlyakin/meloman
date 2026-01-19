// Performance utilities for MeloMania v7.0
// Includes debounce, throttle, device detection, and performance monitoring

/**
 * Debounce function - delays execution until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
}

/**
 * Throttle function - ensures function is called at most once per limit milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Request Animation Frame based throttle for smooth animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (rafId) return;
    
    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Device capability detection
 */
export interface DeviceCapabilities {
  isTouchDevice: boolean;
  isHighDPI: boolean;
  prefersReducedMotion: boolean;
  prefersColorScheme: 'light' | 'dark';
  connectionType: 'slow' | 'medium' | 'fast' | 'unknown';
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  isLowEndDevice: boolean;
}

export function getDeviceCapabilities(): DeviceCapabilities {
  const nav = navigator as any;
  
  const isTouchDevice = 
    'ontouchstart' in window || 
    navigator.maxTouchPoints > 0;
  
  const isHighDPI = window.devicePixelRatio > 1;
  
  const prefersReducedMotion = 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const prefersColorScheme = 
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  
  // Connection type detection
  let connectionType: DeviceCapabilities['connectionType'] = 'unknown';
  if (nav.connection) {
    const effectiveType = nav.connection.effectiveType;
    if (effectiveType === '4g') connectionType = 'fast';
    else if (effectiveType === '3g') connectionType = 'medium';
    else if (effectiveType === '2g' || effectiveType === 'slow-2g') connectionType = 'slow';
  }
  
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = nav.deviceMemory; // undefined if not supported
  
  // Low-end device detection
  const isLowEndDevice = 
    prefersReducedMotion ||
    (deviceMemory !== undefined && deviceMemory < 4) ||
    hardwareConcurrency < 4 ||
    connectionType === 'slow';
  
  return {
    isTouchDevice,
    isHighDPI,
    prefersReducedMotion,
    prefersColorScheme,
    connectionType,
    hardwareConcurrency,
    deviceMemory,
    isLowEndDevice,
  };
}

/**
 * Get optimal particle count based on device capabilities
 */
export function getOptimalParticleCount(baseCount: number): number {
  const capabilities = getDeviceCapabilities();
  
  if (capabilities.prefersReducedMotion) return 0;
  if (capabilities.isLowEndDevice) return Math.floor(baseCount * 0.3);
  if (capabilities.connectionType === 'medium') return Math.floor(baseCount * 0.6);
  
  return baseCount;
}

/**
 * Simple performance monitor
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameId: number | null = null;
  private callback: ((fps: number) => void) | null = null;
  
  start(callback?: (fps: number) => void) {
    this.callback = callback || null;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.tick();
  }
  
  private tick = () => {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;
    
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      if (this.callback) {
        this.callback(this.fps);
      }
    }
    
    this.frameId = requestAnimationFrame(this.tick);
  };
  
  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  getFPS() {
    return this.fps;
  }
  
  isPerformanceGood() {
    return this.fps >= 30;
  }
}

/**
 * Lazy load images with IntersectionObserver
 */
export function lazyLoadImage(
  imgElement: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
): () => void {
  if (!('IntersectionObserver' in window)) {
    imgElement.src = src;
    return () => {};
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgElement.src = src;
        observer.unobserve(imgElement);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
  
  observer.observe(imgElement);
  
  return () => observer.disconnect();
}

/**
 * Preload critical resources
 */
export function preloadResource(
  url: string,
  type: 'image' | 'audio' | 'video' | 'font'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'image':
        link.as = 'image';
        break;
      case 'audio':
        link.as = 'audio';
        break;
      case 'video':
        link.as = 'video';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload: ${url}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get responsive value based on viewport width
 */
export function getResponsiveValue<T>(
  breakpoints: { min: number; value: T }[],
  fallback: T
): T {
  const width = window.innerWidth;
  const sorted = [...breakpoints].sort((a, b) => b.min - a.min);
  
  for (const bp of sorted) {
    if (width >= bp.min) {
      return bp.value;
    }
  }
  
  return fallback;
}

/**
 * Memoize function with cache limit
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Create a stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = { current: callback };
  callbackRef.current = callback;
  
  return ((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }) as T;
}

/**
 * Batch DOM updates using requestAnimationFrame
 */
export class DOMBatcher {
  private updates: (() => void)[] = [];
  private rafId: number | null = null;
  
  add(update: () => void) {
    this.updates.push(update);
    this.scheduleFlush();
  }
  
  private scheduleFlush() {
    if (this.rafId) return;
    
    this.rafId = requestAnimationFrame(() => {
      this.flush();
      this.rafId = null;
    });
  }
  
  private flush() {
    const updates = this.updates.splice(0);
    updates.forEach(update => update());
  }
  
  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates = [];
  }
}

export const domBatcher = new DOMBatcher();

/**
 * Safe localStorage access with fallback
 */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

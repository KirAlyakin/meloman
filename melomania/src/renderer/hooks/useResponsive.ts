import { useState, useEffect, useMemo } from 'react';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// Responsive state interface
export interface ResponsiveState {
  // Current breakpoint
  breakpoint: Breakpoint;
  
  // Device type
  deviceType: DeviceType;
  
  // Window dimensions
  width: number;
  height: number;
  
  // Orientation
  isLandscape: boolean;
  isPortrait: boolean;
  
  // Device capabilities
  isTouchDevice: boolean;
  isHighDPI: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  
  // Breakpoint checks
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isXxl: boolean;
  
  // Comparison helpers
  isAbove: (bp: Breakpoint) => boolean;
  isBelow: (bp: Breakpoint) => boolean;
  isBetween: (minBp: Breakpoint, maxBp: Breakpoint) => boolean;
}

// Debounce helper for resize events
const debounce = <T extends (...args: any[]) => void>(fn: T, wait: number): T => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  }) as T;
};

// Get current breakpoint from width
const getBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Get device type from width
const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

// Check if touch device
const checkTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Check if high DPI display
const checkHighDPI = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.devicePixelRatio > 1;
};

// Check reduced motion preference
const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check dark mode preference
const checkDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Hook for responsive design and device detection
 * Updates on window resize with debouncing for performance
 */
export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [preferences, setPreferences] = useState({
    reducedMotion: checkReducedMotion(),
    darkMode: checkDarkMode(),
  });

  // Handle resize with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = debounce(() => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 100); // 100ms debounce

    window.addEventListener('resize', handleResize);
    
    // Also listen to orientation change for mobile devices
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Listen to preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleDarkChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, darkMode: e.matches }));
    };

    // Modern browsers
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', handleMotionChange);
      darkQuery.addEventListener('change', handleDarkChange);
    }

    return () => {
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', handleMotionChange);
        darkQuery.removeEventListener('change', handleDarkChange);
      }
    };
  }, []);

  // Compute all responsive values
  const state = useMemo((): ResponsiveState => {
    const { width, height } = dimensions;
    const breakpoint = getBreakpoint(width);
    const deviceType = getDeviceType(width);

    return {
      breakpoint,
      deviceType,
      width,
      height,
      
      isLandscape: width > height,
      isPortrait: height >= width,
      
      isTouchDevice: checkTouchDevice(),
      isHighDPI: checkHighDPI(),
      prefersReducedMotion: preferences.reducedMotion,
      prefersDarkMode: preferences.darkMode,
      
      isXs: breakpoint === 'xs',
      isSm: breakpoint === 'sm',
      isMd: breakpoint === 'md',
      isLg: breakpoint === 'lg',
      isXl: breakpoint === 'xl',
      isXxl: breakpoint === 'xxl',
      
      isAbove: (bp: Breakpoint) => width >= BREAKPOINTS[bp],
      isBelow: (bp: Breakpoint) => width < BREAKPOINTS[bp],
      isBetween: (minBp: Breakpoint, maxBp: Breakpoint) => 
        width >= BREAKPOINTS[minBp] && width < BREAKPOINTS[maxBp],
    };
  }, [dimensions, preferences]);

  return state;
}

/**
 * Hook for responsive values based on breakpoints
 * Returns different values based on current breakpoint
 */
export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const { breakpoint } = useResponsive();
  
  return useMemo(() => {
    // Check breakpoints from largest to smallest
    const breakpointOrder: Breakpoint[] = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);
    
    // Find the first defined value at or below current breakpoint
    for (let i = currentIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (values[bp] !== undefined) {
        return values[bp] as T;
      }
    }
    
    return defaultValue;
  }, [breakpoint, values, defaultValue]);
}

/**
 * Hook for container queries (element-based responsiveness)
 */
export function useContainerSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Use ResizeObserver if available
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          setSize({ width, height });
        }
      });

      observer.observe(element);
      return () => observer.disconnect();
    }

    // Fallback: measure once
    const rect = element.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
  }, [ref]);

  return size;
}

export default useResponsive;

/**
 * Hook for optimal animations based on device capabilities
 */
export function useOptimalAnimations(): {
  shouldAnimate: boolean;
  particleCount: (base: number) => number;
  transitionDuration: string;
  animationIntensity: number;
} {
  const { prefersReducedMotion, isTouchDevice, deviceType } = useResponsive();
  
  // Check for low-end device
  const isLowEnd = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as any;
    const memory = nav.deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    return (memory !== undefined && memory < 4) || cores < 4;
  }, []);
  
  return useMemo(() => ({
    shouldAnimate: !prefersReducedMotion && !isLowEnd,
    particleCount: (base: number) => {
      if (prefersReducedMotion) return 0;
      if (isLowEnd) return Math.floor(base * 0.3);
      if (deviceType === 'mobile') return Math.floor(base * 0.5);
      return base;
    },
    transitionDuration: prefersReducedMotion ? '0.01ms' : isLowEnd ? '150ms' : '250ms',
    animationIntensity: prefersReducedMotion ? 0 : isLowEnd ? 0.5 : 1,
  }), [prefersReducedMotion, isLowEnd, deviceType]);
}

/**
 * Hook for keyboard navigation (quiz host controls)
 */
export function useKeyboardNavigation(
  handlers: {
    onNext?: () => void;
    onPrev?: () => void;
    onConfirm?: () => void;
    onCancel?: () => void;
    onSpace?: () => void;
  },
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on input elements
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handlers.onNext?.();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlers.onPrev?.();
          break;
        case ' ':
          e.preventDefault();
          handlers.onSpace?.();
          break;
        case 'Enter':
          e.preventDefault();
          handlers.onConfirm?.();
          break;
        case 'Escape':
          e.preventDefault();
          handlers.onCancel?.();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handlers]);
}

/**
 * Hook for scroll lock (modals, fullscreen)
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    
    const scrollY = window.scrollY;
    const originalStyle = document.body.style.cssText;
    
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      top: -${scrollY}px;
      left: 0;
      right: 0;
    `;
    
    return () => {
      document.body.style.cssText = originalStyle;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

/**
 * Hook for safe area insets (notched devices)
 */
export function useSafeArea(): { top: number; right: number; bottom: number; left: number } {
  const [insets, setInsets] = useState({ top: 0, right: 0, bottom: 0, left: 0 });

  useEffect(() => {
    // Create temporary element to measure CSS env() values
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      top: env(safe-area-inset-top, 0px);
      right: env(safe-area-inset-right, 0px);
      bottom: env(safe-area-inset-bottom, 0px);
      left: env(safe-area-inset-left, 0px);
      pointer-events: none;
      visibility: hidden;
    `;
    document.body.appendChild(el);
    
    const style = getComputedStyle(el);
    setInsets({
      top: parseInt(style.top) || 0,
      right: parseInt(style.right) || 0,
      bottom: parseInt(style.bottom) || 0,
      left: parseInt(style.left) || 0,
    });
    
    document.body.removeChild(el);
  }, []);

  return insets;
}

/**
 * Performance monitoring utilities
 * Tracks metrics like page load time, API calls, etc.
 */

class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = [];
  }

  /**
   * Mark a performance point
   */
  mark(name) {
    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark(name);
      this.marks.set(name, Date.now());
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name, startMark, endMark) {
    if (typeof performance !== "undefined" && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        
        this.measures.push({
          name,
          duration: measure.duration,
          timestamp: Date.now(),
        });

        if (import.meta.env.DEV) {
          console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
        }

        return measure.duration;
      } catch (error) {
        console.warn("Performance measurement failed:", error);
      }
    }
    return null;
  }

  /**
   * Measure time since a mark
   */
  measureSince(name, startMark) {
    const endMark = `${name}-end`;
    this.mark(endMark);
    return this.measure(name, startMark, endMark);
  }

  /**
   * Get all measures
   */
  getMeasures() {
    return this.measures;
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    if (typeof performance !== "undefined") {
      performance.clearMarks();
      performance.clearMeasures();
    }
    this.marks.clear();
    this.measures = [];
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals() {
    if (typeof performance === "undefined") return null;

    const navigation = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");

    return {
      // Time to First Byte
      ttfb: navigation?.responseStart - navigation?.requestStart,
      
      // First Contentful Paint
      fcp: paint.find((entry) => entry.name === "first-contentful-paint")?.startTime,
      
      // DOM Content Loaded
      dcl: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      
      // Load Complete
      load: navigation?.loadEventEnd - navigation?.loadEventStart,
      
      // DOM Interactive
      interactive: navigation?.domInteractive - navigation?.fetchStart,
    };
  }

  /**
   * Log performance summary
   */
  logSummary() {
    if (import.meta.env.DEV) {
      console.group("📊 Performance Summary");
      
      const webVitals = this.getWebVitals();
      if (webVitals) {
        console.log("Web Vitals:");
        console.table(webVitals);
      }

      if (this.measures.length > 0) {
        console.log("\nCustom Measures:");
        console.table(this.measures);
      }

      console.groupEnd();
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook to measure component render time
 */
export function usePerformanceMark(componentName) {
  if (import.meta.env.DEV) {
    React.useEffect(() => {
      const markName = `${componentName}-render`;
      performanceMonitor.mark(markName);
      
      return () => {
        performanceMonitor.measureSince(`${componentName} Render`, markName);
      };
    });
  }
}

/**
 * HOC to measure component performance
 */
export function withPerformanceTracking(Component, name) {
  return function PerformanceTrackedComponent(props) {
    if (import.meta.env.DEV) {
      React.useEffect(() => {
        const startMark = `${name}-mount`;
        performanceMonitor.mark(startMark);
        
        return () => {
          performanceMonitor.measureSince(`${name} Mount`, startMark);
        };
      }, []);
    }

    return React.createElement(Component, props);
  };
}

/**
 * Measure async operation
 */
export async function measureAsync(name, fn) {
  const startMark = `${name}-start`;
  performanceMonitor.mark(startMark);
  
  try {
    const result = await fn();
    performanceMonitor.measureSince(name, startMark);
    return result;
  } catch (error) {
    performanceMonitor.measureSince(`${name} (failed)`, startMark);
    throw error;
  }
}

export default performanceMonitor;


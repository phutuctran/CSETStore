export interface RouteState {
  path: string;       // e.g. '/', '/shop', '/product', '/orders', '/tab'
  param?: string;     // e.g. '1' for productId, or 'tab-hot-deal' for tabId
  query: Record<string, string>; // e.g. { page: '2', cat: 'electronics' }
}

export class RouterService {
  /**
   * Parses current window.location.hash into structured RouteState
   * Supports:
   * #/ -> home
   * #/shop?page=2&cat=fashion -> shop with page and category
   * #/product/3 -> product detail page for id 3
   * #/tab/tab-hot-deal?page=1 -> custom tab page
   * #/orders -> customer orders
   */
  parseHash(): RouteState {
    if (typeof window === 'undefined') {
      return { path: '/', query: {} };
    }

    const hash = window.location.hash.slice(1) || '/';
    const [pathPart, queryPart] = hash.split('?');
    const query: Record<string, string> = {};

    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((val, key) => {
        query[key] = val;
      });
    }

    const segments = pathPart.split('/').filter(Boolean);

    if (segments.length === 0) {
      return { path: '/', query };
    }

    if (segments[0] === 'product' && segments[1]) {
      return { path: '/product', param: segments[1], query };
    }

    if (segments[0] === 'tab' && segments[1]) {
      return { path: '/tab', param: segments[1], query };
    }

    return { path: '/' + segments[0], param: segments[1], query };
  }

  /**
   * Pushes a new route to window.location.hash without page reload
   */
  navigate(path: string, param?: string, query?: Record<string, string | number | undefined>): void {
    if (typeof window === 'undefined') return;

    let target = '#' + (path.startsWith('/') ? path : '/' + path);
    if (param) {
      target += '/' + param;
    }

    if (query && Object.keys(query).length > 0) {
      const sp = new URLSearchParams();
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          sp.set(k, v.toString());
        }
      });
      const qStr = sp.toString();
      if (qStr) target += '?' + qStr;
    }

    if (window.location.hash !== target) {
      window.location.hash = target;
    }
  }
}

export const routerService = new RouterService();

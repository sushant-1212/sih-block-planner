/**
 * Custom Doubly-Linked List Node for LRU Cache
 */
class LRUNode {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
    this.accessCount = 1;
  }
}

/**
 * Custom LRU (Least Recently Used) Cache with O(1) Get & Put operations
 * Designed specifically for caching dynamic railway rerouting graph results.
 */
class LRUCache {
  constructor(capacity = 50) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = new LRUNode(null, null); // Dummy head (MRU)
    this.tail = new LRUNode(null, null); // Dummy tail (LRU)
    this.head.next = this.tail;
    this.tail.prev = this.head;

    // Analytics & Metrics for Hackathon / Jury Demonstration
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      savedComputeTimeMs: 0
    };
  }

  /**
   * Generates a deterministic cache key for routing requests.
   * Sorts blocked edges to ensure order invariance (e.g. [1, 2] vs [2, 1]).
   */
  static generateKey(source, target, blockedEdgeIds = []) {
    const sortedBlocks = Array.isArray(blockedEdgeIds)
      ? [...new Set(blockedEdgeIds.map(Number))].sort((a, b) => a - b).join(',')
      : '';
    return `route:${source}->${target}|blocked:[${sortedBlocks}]`;
  }

  /**
   * Internal helper to remove a node from the linked list.
   */
  _removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * Internal helper to insert a node at the head (Most Recently Used).
   */
  _addToHead(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * Internal helper to move an existing node to head.
   */
  _moveToHead(node) {
    this._removeNode(node);
    this._addToHead(node);
  }

  /**
   * Internal helper to evict the tail node (Least Recently Used).
   */
  _popTail() {
    const nodeToEvict = this.tail.prev;
    if (nodeToEvict === this.head) return null;
    this._removeNode(nodeToEvict);
    this.map.delete(nodeToEvict.key);
    this.stats.evictions++;
    return nodeToEvict;
  }

  /**
   * Retrieves an item from the cache.
   * O(1) time complexity.
   */
  get(key) {
    this.stats.totalRequests++;
    if (!this.map.has(key)) {
      this.stats.misses++;
      return null;
    }

    const node = this.map.get(key);
    node.lastAccessed = Date.now();
    node.accessCount++;
    this._moveToHead(node);
    this.stats.hits++;
    return node.value;
  }

  /**
   * Inserts or updates an item in the cache.
   * O(1) time complexity.
   */
  put(key, value) {
    if (this.map.has(key)) {
      const existingNode = this.map.get(key);
      existingNode.value = value;
      existingNode.lastAccessed = Date.now();
      existingNode.accessCount++;
      this._moveToHead(existingNode);
      return existingNode;
    }

    const newNode = new LRUNode(key, value);
    this.map.set(key, newNode);
    this._addToHead(newNode);

    if (this.map.size > this.capacity) {
      this._popTail();
    }

    return newNode;
  }

  /**
   * Checks whether a key exists in the cache without altering LRU order.
   */
  has(key) {
    return this.map.has(key);
  }

  /**
   * Clears the cache and resets all state.
   */
  clear() {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.totalRequests = 0;
    this.stats.savedComputeTimeMs = 0;
  }

  /**
   * Returns formatted metrics for frontend dashboard & jury monitoring.
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';

    // Collect list of cached routes in LRU order (most recent first)
    const items = [];
    let curr = this.head.next;
    while (curr !== this.tail && items.length < 20) {
      items.push({
        key: curr.key,
        accessCount: curr.accessCount,
        lastAccessed: new Date(curr.lastAccessed).toISOString(),
        travelTime: curr.value?.travelTime,
        path: curr.value?.path
      });
      curr = curr.next;
    }

    return {
      size: this.map.size,
      capacity: this.capacity,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      evictions: this.stats.evictions,
      totalRequests: this.stats.totalRequests,
      cachedItems: items
    };
  }
}

// Singleton cache instance for the application
const routeCache = new LRUCache(Number(process.env.CACHE_CAPACITY) || 50);

module.exports = {
  LRUCache,
  routeCache
};

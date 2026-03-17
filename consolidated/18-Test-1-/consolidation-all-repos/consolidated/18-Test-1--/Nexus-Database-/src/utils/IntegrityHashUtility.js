class IntegrityHashUtility {
  constructor() {}
  async calculateHash(data) {
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }
  async calculateRecursiveHash(data, depth = 0, maxDepth = 5) {
    if (depth >= maxDepth) return await this.calculateHash(data);
    const hashedData = await this.calculateHash(data);
    return await this.calculateRecursiveHash(hashedData, depth + 1, maxDepth);
  }
}
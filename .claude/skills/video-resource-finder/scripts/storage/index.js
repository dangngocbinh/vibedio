const LocalStorageAdapter = require('./local-adapter');
// Future: const CloudStorageAdapter = require('./cloud-adapter');

/**
 * Factory to create storage adapters
 * @param {string} type - 'local' | 'cloud' (future)
 * @param {Object} config - Adapter configuration
 * @returns {BaseStorageAdapter}
 */
function createStorageAdapter(type, config = {}) {
  switch (type) {
    case 'local':
      return new LocalStorageAdapter(config);

    // Future cloud adapters
    // case 's3':
    //   return new S3Adapter(config);
    // case 'gcs':
    //   return new GCSAdapter(config);
    // case 'cloudinary':
    //   return new CloudinaryAdapter(config);
    // case 'cloud':
    //   return new CloudStorageAdapter(config);

    default:
      console.log(`[Storage] Unknown type "${type}", using local storage`);
      return new LocalStorageAdapter(config);
  }
}

module.exports = {
  createStorageAdapter,
  LocalStorageAdapter
};

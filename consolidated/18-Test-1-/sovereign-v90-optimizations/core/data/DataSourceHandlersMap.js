import { DataSourcePrimitives } from './DataSourcePrimitives.js';
import APIPullSyncHandler from './handlers/APIPullSyncHandler.js';
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js';

/**
 * @typedef {import('./handlers/IDataSourceHandler.js').IDataSourceHandler} IDataSourceHandler
 */

/**
 * Creates a frozen map of data source handlers.
 * @type {Readonly<Record<string, IDataSourceHandler>>}
 */
const DataSourceHandlersMap = Object.freeze({
    [DataSourcePrimitives.API_PULL_SYNC]: APIPullSyncHandler,
    [DataSourcePrimitives.MESSAGE_BUS_ASYNC]: MessageBusAsyncHandler,
    [DataSourcePrimitives.DATABASE_QUERY]: DBPersistenceHandler,
});

export default DataSourceHandlersMap;

import { DataSourcePrimitives } from './DataSourcePrimitives.js';
import APIPullSyncHandler from './handlers/APIPullSyncHandler.js';
import MessageBusAsyncHandler from './handlers/MessageBusAsyncHandler.js';
import DBPersistenceHandler from './handlers/DBPersistenceHandler.js';

/**
 * @typedef {import('./handlers/IDataSourceHandler.js').IDataSourceHandler} IDataSourceHandler
 */

/**
 * @type {Readonly<Record<string, IDataSourceHandler>>}
 * 
 * Data Source Handler Strategy Map (Service Locator Pattern).
 * Maps standardized retrieval methods (defined in DataSourcePrimitives) 
 * to concrete implementation classes for data interaction.
 * 
 * This map is frozen for runtime safety and configuration integrity.
 * Handler classes MUST implement the IDataSourceHandler interface.
 */
const DataSourceHandlersMap = Object.freeze({
    // Synchronous data retrieval methods
    [DataSourcePrimitives.API_PULL_SYNC]: APIPullSyncHandler,

    // Asynchronous/Event-driven data retrieval methods
    [DataSourcePrimitives.MESSAGE_BUS_ASYNC]: MessageBusAsyncHandler,

    // Persistence/storage layer access methods
    [DataSourcePrimitives.DATABASE_QUERY]: DBPersistenceHandler,
});

export default DataSourceHandlersMap;
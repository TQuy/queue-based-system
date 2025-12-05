import { DatastoreService } from "@/types/datastore.js";

class DataStoreServiceManager {
    private dataStore: DatastoreService | null = null;
    constructor(dataStore?: DatastoreService) {
        this.dataStore = dataStore || null;
    }

    getDataStoreServiceInstance(): DatastoreService {
        if (!this.dataStore) {
            throw new Error('DatastoreService not initialized yet');
        }
        return this.dataStore;
    }

    setDataStoreServiceInstance(dataStore: DatastoreService): void {
        this.dataStore = dataStore;
    }
}

export const dataStoreServiceManager = new DataStoreServiceManager();
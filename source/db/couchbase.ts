import * as couchbase from "couchbase";

export class Couchbase {
    private collection: couchbase.Collection | null = null;

    private getKey (appId: string, userId: string, key: string) {
        return userId + ":" + appId + ":" + key;
    }

    async initialize () {
        const clusterConnStr = 'couchbase://' + process.env.COUCHBASE_HOST;
        const cluster = await couchbase.connect(clusterConnStr, {
            username: process.env.COUCHBASE_USER,
            password: process.env.COUCHBASE_PASSWORD,
        });
        const bucket = cluster.bucket(process.env.COUCHBASE_BUCKET ?? "bucket");
        this.collection = bucket.defaultCollection();
    }

    async insert (appId: string, userId: string, key: string, data: any, timeout?: number, callback?: couchbase.NodeCallback<couchbase.MutationResult>) {
        this.collection?.upsert(this.getKey(appId, userId, key), data, {timeout: timeout ?? 0}, callback);
    }

    async append (appId: string, userId: string, key: string, data: any) {
        this.exists(appId, userId, key, data, (exists: boolean) => {
            if (exists) {
                this.collection?.mutateIn(this.getKey(appId, userId, key), [
                    couchbase.MutateInSpec.arrayAppend('', data),
                ]);
            }
        });
    }

    async exists (appId: string, userId: string, key: string, data?: any, callback?: Function) {
        const keyString: string = this.getKey(appId, userId, key);

        this.collection?.insert(keyString, [data ?? ""], undefined, async (err, result) => {
            const exists: boolean = err != undefined;
            if (!data && !exists) {
                await this.collection?.remove(keyString);
            }
            callback?.(exists);
        });
    }

    async get (appId: string, userId: string, key: string, callback?: couchbase.NodeCallback<couchbase.GetResult>) {
        this.collection?.get(this.getKey(appId, userId, key), undefined, callback);
    }

}

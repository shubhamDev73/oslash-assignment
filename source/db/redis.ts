import { createClient } from 'redis';

class Redis {

    private client = createClient();

    async initialise () {
        await this.client.connect()
        await this.client.select(parseInt(
            (process.env.NODE_ENV == 'test' ? process.env.REDIS_TEST_DB : process.env.REDIS_DB) ?? '0'
        ));
    }

    getKey (appId: string, userId: string, key: string): string {
        return userId + ":" + appId + ":" + key;
    }

    insert (appId: string, userId: string, key: string, data: any, timeout?: number) {
        return this.client.set(this.getKey(appId, userId, key), data, timeout ? {'PX': timeout} : undefined)
    }

    exists (appId: string, userId: string, key: string) {
        return new Promise<boolean>((resolve, reject) => {
            this.client.exists(this.getKey(appId, userId, key))
            .then((value: number | null) => resolve(value === 1))
            .catch(reject);
        });
    }

    get (appId: string, userId: string, key: string) {
        return this.client.get(this.getKey(appId, userId, key));
    }

    hSet (appId: string, userId: string, key: string, hKey: string, data: any) {
        return this.client.hSet(this.getKey(appId, userId, key), hKey, data)
    }

    hGetAll (appId: string, userId: string, key: string) {
        return this.client.hGetAll(this.getKey(appId, userId, key))
    }

    hDel (appId: string, userId: string, key: string, hKey: string) {
        return this.client.hDel(this.getKey(appId, userId, key), hKey)
    }

    close () {
        return this.client.flushDb()
                .then(() => this.client.quit());
    }

}

export const redis = new Redis();
